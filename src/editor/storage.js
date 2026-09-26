// 本地编辑器的存储层
//   · 文字改动 —— localStorage（体积极小，刷新即恢复）
//   · 图片 / 视频 —— IndexedDB（Blob，容量远大于 localStorage，可放视频）
// 两者都以「覆盖层」的形式存在，不改动 data/site.js 里的原始数据。

const LS_KEY = 'ly_portfolio_overrides_v1'
const DB_NAME = 'ly_portfolio_media'
const STORE = 'files'

/* ---------------- 文字 / 结构改动 ---------------- */

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveOverrides(o) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(o))
  } catch (e) {
    console.warn('[editor] 保存失败，可能超出容量', e)
  }
}

export function clearOverrides() {
  localStorage.removeItem(LS_KEY)
}

/* ---------------- 媒体文件（IndexedDB） ---------------- */

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function putFile(id, blob) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => res(id)
    tx.onerror = () => rej(tx.error)
  })
}

export async function getFile(id) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(id)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}

/** 由 Blob 生成可直接用于 <img>/<video> 的对象 URL（调用方负责 revoke） */
export async function makeURL(id) {
  const blob = await getFile(id)
  return blob ? URL.createObjectURL(blob) : null
}

export async function delFile(id) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

export async function wipeFiles() {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
}
