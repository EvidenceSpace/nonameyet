export class AnalysisClientError extends Error { constructor(code){super(code);this.name='AnalysisClientError';this.code=code;} }
export async function requestAnalysis({file,processingJob,signal,fetchImpl=fetch}){
  if(processingJob?.status!=="ready_for_ai"||processingJob.fileId!==file.id||processingJob.fileHash!==file.sha256)throw new AnalysisClientError("stale_source");
  const response=await fetchImpl("/api/analyze",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},signal,body:JSON.stringify({fileId:file.id,fileHash:file.sha256,fileName:file.name,pages:processingJob.artifact.pages})});
  let body={};try{body=await response.json()}catch{}
  if(!response.ok)throw new AnalysisClientError(body.error||`http_${response.status}`);
  if(body.fileId!==file.id||body.fileHash!==file.sha256||!Array.isArray(body.candidates))throw new AnalysisClientError("response_mismatch");
  return body.candidates;
}
