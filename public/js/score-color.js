module.exports = scoreColor

// Assigns appropriate color to score badge
const certified = '#5ac878'
const ok = '#ffb726'
const bad = '#ff6040'

const scoreColors = [
  [95, certified],
  [86, ok],
  [0, bad]
]

function scoreColor (el, score) {
  scoreColor =  scoreColors.find((conf) => conf[0] <= score)[1]

  el.style.backgroundColor = scoreColor
  el.style.borderColor = scoreColor
}
