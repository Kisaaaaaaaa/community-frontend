// 使用 index.html 中通过普通 script 引入的 qrcodejs（window.QRCode）绘制二维码
// level：纠错等级 L/M/Q/H。内容很长（如带签名的收银台链接）时用 L 可显著降低模块密度
export function renderQrCode(el, text, size = 176, level = 'M') {
  if (!el || !text) return false
  const QRCode = window.QRCode
  if (!QRCode) {
    console.warn('qrcode 库未加载')
    return false
  }
  // qrcodejs 不会自动覆盖已有内容，先清空
  el.innerHTML = ''
  new QRCode(el, {
    text,
    width: size,
    height: size,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel[level] ?? QRCode.CorrectLevel.M
  })
  return true
}
