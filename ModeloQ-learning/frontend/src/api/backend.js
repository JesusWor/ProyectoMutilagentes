import axios from 'axios'
const API = axios.create({ baseURL: 'http://localhost:8000' })

export async function getState(){
  return (await API.get('/state')).data
}

export async function startTrain(payload){
  return (await API.post('/train', payload)).data
}

export async function stopTrain(){
  return (await API.post('/stop')).data
}

export async function updateParams(p){
  return (await API.post('/params', p)).data
}

export async function getStats(){
  return (await API.get('/stats')).data
}

export async function saveQ(){
  return (await API.post('/save')).data
}

export async function loadQ(){
  return (await API.post('/load')).data
}

export async function runTrainedModel(body) {
  const res = await API.post('/run-trained', body)
  return res.data
}

export async function stopTrained() {
  return (await API.post('/stop-trained')).data
}
