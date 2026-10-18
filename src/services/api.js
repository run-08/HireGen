// Default API Base URLs
// By default uses direct localhost ports with fallback support to Vite proxy
export const DEFAULT_CONFIG = {
  useProxy: false,
  stripperUrl: 'http://localhost:9090',
  interviewerUrl: 'http://localhost:9091',
  proxyStripperUrl: '/api/stripper',
  proxyInterviewerUrl: '/api/interviewer',
};

export function getResolvedUrls(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  return {
    stripper: cfg.useProxy ? cfg.proxyStripperUrl : (cfg.stripperUrl || 'http://localhost:9090'),
    interviewer: cfg.useProxy ? cfg.proxyInterviewerUrl : (cfg.interviewerUrl || 'http://localhost:9091'),
  };
}

/**
 * Uploads a PDF file to ResumeTextStriper service (port 9090).
 * Endpoint: POST /hireGEN/getSkillSet
 * Payload: FormData with 'file' part
 * Returns: Extracted resume text string
 */
export async function uploadResumePdf(file, config = {}) {
  if (!file) throw new Error("No file provided");
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error("Invalid format. Please upload a PDF file only (.pdf)");
  }

  const { stripper } = getResolvedUrls(config);
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${stripper}/hireGEN/getSkillSet`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`ResumeTextStriper error (${res.status}): ${errText || res.statusText}`);
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      throw new Error("No text could be extracted from this PDF. Please check if the PDF contains selectable text.");
    }
    return text.trim();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to ResumeTextStriper at ${stripper}. Is the backend running on port 9090?`);
    }
    throw err;
  }
}

/**
 * Initiates the interview session with QuestionMaker service (port 9091).
 * Endpoint: POST /getQuestionFromResume
 * Payload: { resumeContent: string }
 * Response: SSE stream with header X-Conversation-Id
 */
export async function startInterviewSession(resumeContent, config = {}, onChunk, onDone, onError) {
  const { interviewer } = getResolvedUrls(config);

  try {
    const res = await fetch(`${interviewer}/getQuestionFromResume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, text/plain, */*',
      },
      body: JSON.stringify({ resumeContent }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`QuestionMaker error (${res.status}): ${errText || res.statusText}`);
    }

    const conversationId = 
      res.headers.get('X-Conversation-Id') || 
      res.headers.get('x-conversation-id') || 
      `session-${Date.now()}`;

    // Read the reactive SSE stream
    await processEventStream(res, onChunk, onDone);

    return conversationId;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const errorMsg = `Cannot connect to QuestionMaker at ${interviewer}. Is the backend running on port 9091?`;
      onError ? onError(new Error(errorMsg)) : null;
      throw new Error(errorMsg);
    }
    onError ? onError(err) : null;
    throw err;
  }
}

/**
 * Sends candidate response to QuestionMaker service.
 * Endpoint: POST /chat/{conversationId}
 * Payload: { message: string }
 * Response: SSE stream
 */
export async function sendCandidateAnswer(conversationId, message, config = {}, onChunk, onDone, onError) {
  const { interviewer } = getResolvedUrls(config);

  try {
    const res = await fetch(`${interviewer}/chat/${encodeURIComponent(conversationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, text/plain, */*',
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`QuestionMaker error (${res.status}): ${errText || res.statusText}`);
    }

    await processEventStream(res, onChunk, onDone);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const errorMsg = `Connection lost to QuestionMaker at ${interviewer}.`;
      onError ? onError(new Error(errorMsg)) : null;
      throw new Error(errorMsg);
    }
    onError ? onError(err) : null;
    throw err;
  }
}

/**
 * Robust reactive stream parser handling both standard SSE (data: ...) and raw text chunks
 */
async function processEventStream(response, onChunk, onDone) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Hold partial line for next iteration

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data:')) {
          const content = line.replace(/^data:\s?/, '');
          if (content) onChunk(content);
        } else if (!trimmed.startsWith(':')) {
          // Plain streaming chunk
          onChunk(line);
        }
      }
    }

    // Flush any remaining buffer
    if (buffer.trim()) {
      if (buffer.trim().startsWith('data:')) {
        const content = buffer.replace(/^data:\s?/, '');
        if (content) onChunk(content);
      } else if (!buffer.trim().startsWith(':')) {
        onChunk(buffer);
      }
    }

    onDone?.();
  } catch (err) {
    console.error("Error reading stream:", err);
    throw err;
  }
}

/**
 * Checks connectivity to both backend servers
 */
export async function checkBackendServices(config = {}) {
  const { stripper, interviewer } = getResolvedUrls(config);

  const result = {
    stripper: { url: stripper, alive: false, message: '' },
    interviewer: { url: interviewer, alive: false, message: '' },
  };

  try {
    const sRes = await fetch(`${stripper}/hireGEN/greet`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (sRes.ok) {
      result.stripper.alive = true;
      result.stripper.message = 'Online (Port 9090)';
    }
  } catch (e) {
    result.stripper.alive = false;
    result.stripper.message = 'Offline';
  }

  try {
    // Attempt an OPTIONS or quick ping to port 9091
    const iRes = await fetch(`${interviewer}/getQuestionFromResume`, { 
      method: 'OPTIONS', 
      signal: AbortSignal.timeout(3000) 
    }).catch(() => null);

    if (iRes) {
      result.interviewer.alive = true;
      result.interviewer.message = 'Online (Port 9091)';
    } else {
      // Try GET fallback
      const iGet = await fetch(`${interviewer}/`, { method: 'GET', signal: AbortSignal.timeout(2000) }).catch(() => null);
      if (iGet) {
        result.interviewer.alive = true;
        result.interviewer.message = 'Online (Port 9091)';
      }
    }
  } catch (e) {
    result.interviewer.alive = false;
    result.interviewer.message = 'Offline';
  }

  return result;
}
