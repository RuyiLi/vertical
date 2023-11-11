const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const puzzle = {
  extras: ['', '', '', 'LATIN', 'TEXT'],
  answers: ['LOREM', 'IPSUM', 'DOLOR', 'SIT', 'AMET'],
  scramble: [2, 1, 4, 3, 0],
}

const fullWords = [0, 1, 2, 3, 4].map((i) => puzzle.answers[i] + puzzle.extras[i])

// Color in cells for filler characters
const gridRows = $$('.game-grid .game-grid-row')
for (let i = 0; i < 5; i++) {
  const rowCells = gridRows.item(i).children
  for (let j = puzzle.answers[i].length; j < 5; j++) {
    rowCells.item(j).classList.add('game-grid-cell-filler')
  }
}

// Populate letters
const letterColumns = $$('.game-letters .game-letters-col')
function renderLetters() {
  const colLetters = puzzle.scramble.map((i) => fullWords.map((word) => word[i]))
  for (let i = 0; i < 5; i++) {
    const col = letterColumns.item(i)
    colLetters[i].forEach((c, i) => (col.children.item(i).innerText = c))
  }
}
renderLetters()

// Display extras
const extraRows = $$('.game-grid-extras .game-grid-extra')
puzzle.extras.forEach((extra, i) => {
  const answer = puzzle.answers[i]
  const extraText = answer.length > 5 ? answer.slice(5) : extra.slice(5 - answer.length)
  for (const c of extraText) {
    const node = document.createElement('div')
    node.classList.add('game-grid-cell', 'game-grid-cell-filler')
    node.style.textAlign = 'center'
    node.innerText = c
    extraRows.item(i).append(node)
  }
  // extraRows.item(i).innerText = extraText
})

// D&D
const drag = {
  col: -1,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
  target: -1,
  get active() {
    return this.col !== -1
  },
}
const targeted = [false, false, false, false, false]

const ghosts = []
for (let i = 0; i < 5; i++) {
  const idx = puzzle.scramble.indexOf(i)
  const ghost = letterColumns.item(idx).cloneNode(true)
  ghost.classList.add('game-letters-ghost')
  document.body.append(ghost)
  ghosts.push(ghost)
}

document.addEventListener('mousemove', function (evt) {
  if (!drag.active) return
  const ghost = ghosts[puzzle.scramble[drag.col]]
  drag.x = evt.pageX - drag.offsetX
  drag.y = evt.pageY - drag.offsetY
  ghost.style.transform = `translate(${drag.x}px, ${drag.y}px)`
})

function trySwap(from) {
  const targets = targeted.map((v, i) => (v ? i : -1)).filter((v) => v !== -1)
  if (targets.length > 1) {
    setTimeout(trySwap, 0)
  } else if (targets.length === 1) {
    const to = targets[0]
    if (from === to) return
    const a = puzzle.scramble[from]
    const b = puzzle.scramble[to]
    puzzle.scramble[from] = b
    puzzle.scramble[to] = a
    requestAnimationFrame(renderLetters)
  }
}

function hasSolved() {
  return puzzle.scramble.every((v, i) => v === i)
}

document.addEventListener('mouseup', function (evt) {
  if (!drag.active) return
  ghosts[puzzle.scramble[drag.col]].style.display = 'none'
  letterColumns.item(drag.col).style.opacity = '1'
  trySwap(drag.col)
  drag.col = -1

  // Win condition
  if (hasSolved()) {
    setTimeout(() => alert('you win'), 100)
  }
})

for (let i = 0; i < 5; i++) {
  const col = letterColumns.item(i)
  col.addEventListener('mousedown', function (evt) {
    if (drag.active) return
    const { left, top } = col.getBoundingClientRect()
    drag.offsetX = evt.pageX - left
    drag.offsetY = evt.pageY - top
    col.style.opacity = '0.5'
    drag.col = i
    const ghost = ghosts[puzzle.scramble[i]]
    ghost.style.display = 'block'
    ghost.style.transform = `translate(${left}px, ${top}px)`
    console.log(ghosts[puzzle.scramble[i]].style)
  })

  col.addEventListener('mouseover', function () {
    targeted[i] = true
  })

  col.addEventListener('mouseleave', function () {
    targeted[i] = false
  })
}
