// ES modules and fetch require an HTTP origin; direct file opening is explained
// before the browser blocks the module loader, rather than leaving a spinner.
if (window.location.protocol === 'file:') {
  document.getElementById('loading').hidden = true;
  document.getElementById('load-error').hidden = false;
  document.getElementById('error-message').textContent = '这是分文件网页项目，请通过本地服务器或 GitHub Pages 访问。';
}
document.getElementById('retry-button').addEventListener('click', () => window.location.reload());
