var createClient = require('../')
var client = createClient('ws://localhost:8080')
// 
// window.addEventListener('keydown', function (ev) {
//   if (ev.keyCode === 'X'.charCodeAt(0)) erase = !erase
// })
// function ctrlToggle (ev) { erase = !ev.ctrlKey }
// window.addEventListener('keyup', ctrlToggle)
// window.addEventListener('keydown', ctrlToggle)