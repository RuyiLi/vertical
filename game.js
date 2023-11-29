const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const puzzles = [
  {
    extras: ['', '', '', 'LATIN', 'TEXT'],
    answers: ['LOREM', 'IPSUM', 'DOLOR', 'SIT', 'AMET'],
    scramble: [2, 1, 4, 3, 0],
  },
  {
    extras: ['', '', 'NURSERY', '', 'RHYME'],
    answers: ['LONDON', 'BRIDGE', 'IS', 'FALLING', 'DOWN'],
    scramble: [4, 0, 3, 1, 2],
  },
  {
    extras: ['', '', '', 'IDIOM', ''],
    answers: ['ACTIONS', 'SPEAK', 'LOUDER', 'THAN', 'WORDS'],
    scramble: [3, 2, 1, 0, 4],
  },
  {
    extras: ['', '', 'WORLD', 'WAR', 'TWO'],
    answers: ['HERES', 'LOOKIN', 'AT', 'YOU', 'KID'],
    scramble: [0, 4, 2, 3, 1],
  },
  {
    extras: ['', 'JOY', 'HAPPY', 'ELATION', 'GRIN'],
    answers: ['SMILE', 'FROM', 'EAR', 'TO', 'EAR'],
    scramble: [1, 3, 4, 0, 2],
  },
  {
    extras: ['HEALTH', 'DIET', 'FOOD', 'BODY', 'FIT'],
    answers: ['YOU', 'ARE', 'WHAT', 'YOU', 'EAT'],
    scramble: [1, 3, 4, 0, 2],
  },
]

const params = new URLSearchParams(location.search)
const puzzleParamNum = Number(params.get('p'))

const today = new Date()
const dayInMS = 24 * 60 * 60 * 1000
const firstDate = new Date(2023, 10, 27)
const puzzleDateNum = Math.floor((today - firstDate) / dayInMS)
const puzzleIndex = params.has('p') ? puzzleParamNum - 1 : puzzleDateNum
const puzzle = puzzles[puzzleIndex]
const fullWords = [0, 1, 2, 3, 4].map((i) => puzzle.answers[i] + puzzle.extras[i])

const puzzleDate = new Date(firstDate.getTime() + puzzleIndex * dayInMS)
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const month = months[puzzleDate.getMonth()]

$('#puzzle-index').innerText = puzzleIndex + 1
$('#date').innerText = month + ' ' + puzzleDate.getDate()
document.title = 'Vertical #' + (puzzleIndex + 1)

// Load prev state for current puzzle or reset if not exists
const initialState = localStorage.getItem(puzzleIndex)
let currSwaps = 0
let puzzleLocked = false
if (initialState) {
  const { swaps, scramble } = JSON.parse(initialState)
  currSwaps = swaps
  puzzle.scramble = scramble
}

const gameSuccessModal = $('.game-success-modal')
gameSuccessModal.addEventListener('click', function () {
  gameSuccessModal.classList.remove('game-success-modal-active')
})

const shareSuccessBtn = $('.game-success-modal')
shareSuccessBtn.addEventListener('click', function () {
  const link = `https://ruyili.ca/vertical?p=${puzzleIndex + 1}`
  navigator.clipboard.writeText(
    `I solved Vertical #${puzzleIndex + 1} in ${currSwaps} swaps!\n${link}`
  )
})

function maybeGameOver() {
  if (!hasSolved()) return
  puzzleLocked = true
  $('#swaps').innerText = currSwaps
  gameSuccessModal.classList.add('game-success-modal-active')
}
maybeGameOver()

// Previous puzzles
const previousPuzzlesContainer = $('#previous')
for (let i = 1; i <= puzzleDateNum + 1; i++) {
  const a = document.createElement('a')
  a.href = 'https://ruyili.ca/vertical?p=' + i
  a.innerText = '#' + i
  previousPuzzlesContainer.append(a)
}

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
    node.classList.add('game-grid-cell', answer.length < 5 && 'game-grid-cell-filler')
    node.style.textAlign = 'center'
    node.innerText = c
    extraRows.item(i).append(node)
  }
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

    // update swaps & localstorage
    currSwaps++
    localStorage.setItem(
      puzzleIndex,
      JSON.stringify({
        swaps: currSwaps,
        scramble: puzzle.scramble,
      })
    )

    requestAnimationFrame(renderLetters)
  }
}

function hasSolved() {
  return puzzle.scramble.every((v, i) => v === i)
}

function move(evt) {
  if (!drag.active) return
  const ghost = ghosts[puzzle.scramble[drag.col]]
  const x = evt.pageX
  const y = evt.pageY
  drag.x = x - drag.offsetX
  drag.y = y - drag.offsetY
  ghost.style.transform = `translate(${drag.x}px, ${drag.y}px)`

  // can't figure out the pointer enter/leave events so doing it manually for now
  for (let i = 0; i < 5; i++) {
    const col = letterColumns.item(i)
    const rect = col.getBoundingClientRect()
    const inBounds = rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom
    targeted[i] = inBounds
    // manually apply hover effect for mobile
    col.classList.toggle('game-letters-col-hover', inBounds)
  }
}

function end(evt) {
  if (!drag.active) return
  ghosts[puzzle.scramble[drag.col]].style.display = 'none'
  letterColumns.item(drag.col).style.opacity = '1'
  trySwap(drag.col)
  drag.col = -1

  for (let i = 0; i < 5; i++) {
    const col = letterColumns.item(i)
    col.classList.remove('game-letters-col-hover')
  }

  maybeGameOver()
}

document.addEventListener('pointermove', move)
document.addEventListener('pointerup', end)

for (let i = 0; i < 5; i++) {
  const col = letterColumns.item(i)

  col.addEventListener('pointerdown', function (evt) {
    if (drag.active || puzzleLocked) return
    const { left, top } = col.getBoundingClientRect()
    drag.offsetX = evt.pageX - left
    drag.offsetY = evt.pageY - top
    col.style.opacity = '0.5'
    drag.col = i
    const ghost = ghosts[puzzle.scramble[i]]
    ghost.style.display = 'grid'
    ghost.style.transform = `translate(${left}px, ${top}px)`
  })

  col.addEventListener('touchstart', (evt) => evt.preventDefault())

  // https://github.com/w3c/pointerevents/issues/346
  // col.addEventListener('pointerenter', () => (targeted[i] = true))
  // col.addEventListener('pointerout', () => (targeted[i] = false))
}
