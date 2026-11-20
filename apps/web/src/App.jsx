import { useEffect, useState } from 'react'
import { API_URL } from './api.js'
import { RULES, RELEASE } from './rules.js'
import StatusBar from './StatusBar.jsx'
export default function App() {
  const [records,setRecords]=useState([]), [text,setText]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false)
  async function request(path,options={}) {
    if (!API_URL) throw Error('서버 주소가 없습니다. VITE_API_URL을 설정하고 다시 배포하세요')
    const r=await fetch(API_URL+path,{...options,signal:AbortSignal.timeout(90000)})
    const b=await r.json().catch(()=>null)
    if (!r.ok || !b) throw Error(b?.error || `응답 오류 ${r.status}`)
    return b
  }
  async function load(){ try { setRecords((await request('/api/records')).records);setError('') } catch(e){setError(e.message)} }
  useEffect(()=>{load()},[])
  async function save(e){
    e.preventDefault()
    const body=text.trim()
    if(body.length<RULES.minLength||body.length>RULES.maxLength){setError(`공백 제거 후 ${RULES.minLength}~${RULES.maxLength}자로 입력하세요`);return}
    setBusy(true)
    try {await request('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body})});setText('');await load()}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <><main className="app"><p>NETWORK SERVICE LAB / {RELEASE}</p><h1>함께 보는 짧은 메모</h1><p className="where">저장 위치: <strong>서버가 연결한 PostgreSQL</strong>. 수업용 가상 메모만 입력하세요.</p><form onSubmit={save} className="add"><input aria-label="메모" value={text} onChange={e=>setText(e.target.value)} placeholder="메모를 입력하세요"/><button disabled={busy}>{busy?'저장 중…':'저장'}</button></form><p>공백 제거 후 {RULES.minLength}~{RULES.maxLength}자 · 현재 {text.trim().length}자</p>{error&&<p role="alert" style={{color:'#b83232'}}>{error}</p>}<button onClick={load}>목록 다시 불러오기</button>{records.length?<ul className="list">{records.map(r=><li key={r.id}><span>{r.body}</span><time>{new Date(r.createdAt).toLocaleString('ko-KR')}</time></li>)}</ul>:<p className="empty">기록이 없거나 아직 조회하지 못했습니다.</p>}</main><StatusBar/></>
}
