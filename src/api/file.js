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
