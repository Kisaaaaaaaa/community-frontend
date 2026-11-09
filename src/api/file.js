import request from '@/utils/request'

// 图片上传（multipart/form-data）
// 返回 { fileId, fileName, size, url }，url 可直接用于 <img> 展示
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/files/upload',
    method: 'post',
    data: formData
  })
}

// 通用文件上传（按 usage 区分限制）
// usage: TOOL_IMAGE（STAFF/ADMIN，图片≤5MB）/ REPAIR_PROOF（居民，图片≤5MB）
//        / KB_DOC（仅 ADMIN，PDF/DOCX/JPG/PNG，≤20MB）
// 返回 { fileId, fileName, size, fileSize, url }
export function uploadFile(file, usage) {
  const formData = new FormData()
  formData.append('file', file)
  if (usage) {
    formData.append('usage', usage)
  }
  return request({
    url: '/files/upload',
    method: 'post',
    data: formData
  })
}
