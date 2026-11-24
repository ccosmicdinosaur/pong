const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const startButton = document.getElementById('startButton');

const gameState = {
  active: false,
  started: false,
  bricks: [],
  brickRows: 4,
  brickCols: 6,
  paddle: { x: 0, y: canvas.height - 28, width: 90, height: 14 },
  ball: { x: canvas.width / 2, y: canvas.height - 50, radius: 8, vx: 280, vy: -280 },
  animationFrameId: null,
  lastFrameTime: 0,
  audioCtx: null,
  pointerX: canvas.width / 2,
  keys: { left: false, right: false },
};

function createBricks() {
  const bricks = [];
  const brickWidth = 62;
  const brickHeight = 24;
  const padding = 12;
  const offsetTop = 40;
  const offsetLeft = 28;

  for (let row = 0; row < gameState.brickRows; row += 1) {
    for (let col = 0; col < gameState.brickCols; col += 1) {
      bricks.push({
        x: offsetLeft + col * (brickWidth + padding),
        y: offsetTop + row * (brickHeight + padding),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        color: [`#ffb3b3`, `#ff8a8a`, `#ff5c5c`, `#e53935`][row % 4],
      });
    }
  }

  return bricks;
}

function updateTimer() {
  timerEl.textContent = gameState.bricks.filter((brick) => brick.alive).length;
}

function getAudioContext() {
  if (!gameState.audioCtx) {
    gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (gameState.audioCtx.state === 'suspended') {
    gameState.audioCtx.resume();
  }
  return gameState.audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.08) {
  const audioContext = getAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#07111f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 12; i += 1) {
    const y = 24 + i * 28;
    ctx.fillRect(18, y, canvas.width - 36, 1);
  }
}

function drawBricks() {
  gameState.bricks.forEach((brick) => {
    if (!brick.alive) return;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
  });
}

function drawPaddle() {
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();
}

function render() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();

  if (!gameState.started) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click Start to begin', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '16px Arial';
    ctx.fillText('Use the left and right arrows to move the paddle', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function clampPaddle() {
  gameState.paddle.x = Math.max(0, Math.min(canvas.width - gameState.paddle.width, gameState.paddle.x));
}

function updatePaddlePosition() {
  if (gameState.keys && gameState.keys.left) {
    gameState.paddle.x -= 24;
  }
  if (gameState.keys && gameState.keys.right) {
    gameState.paddle.x += 24;
  }
  clampPaddle();
}

function endGame(won = false) {
  gameState.active = false;
  if (gameState.animationFrameId) {
    window.cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;
  }

  render();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'You Win!' : 'Game Over', canvas.width / 2, canvas.height / 2 - 18);
  ctx.font = '20px Arial';
  ctx.fillText('No score tracking', canvas.width / 2, canvas.height / 2 + 20);
  startButton.textContent = 'Play Again';
  startButton.disabled = false;
  playTone(won ? 700 : 220, 0.25, won ? 'triangle' : 'sine', 0.1);
}

function startGame() {
  gameState.active = true;
  gameState.started = true;
  gameState.bricks = createBricks();
  gameState.pointerX = canvas.width / 2;
  gameState.keys = { left: false, right: false };
  gameState.paddle.x = canvas.width / 2 - gameState.paddle.width / 2;
  gameState.ball.x = canvas.width / 2;
  gameState.ball.y = canvas.height - 50;
  gameState.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 320;
  gameState.ball.vy = -320;
  gameState.lastFrameTime = 0;
  updateTimer();
  startButton.textContent = 'Playing...';
  startButton.disabled = true;
  playTone(660, 0.12, 'square', 0.08);

  if (gameState.animationFrameId) {
    window.cancelAnimationFrame(gameState.animationFrameId);
  }
  gameState.animationFrameId = window.requestAnimationFrame(gameLoop);
}

function hitBrick(brick) {
  brick.alive = false;
  gameState.bricks.filter((item) => item.alive).length;
  updateTimer();
  playTone(680, 0.06, 'triangle', 0.08);
}

function gameLoop(timestamp) {
  if (!gameState.active) return;

  if (!gameState.lastFrameTime) {
    gameState.lastFrameTime = timestamp;
  }

  const deltaTime = Math.min(0.03, (timestamp - gameState.lastFrameTime) / 1000);
  gameState.lastFrameTime = timestamp;

  updatePaddlePosition();

  const ball = gameState.ball;
  ball.x += ball.vx * deltaTime;
  ball.y += ball.vy * deltaTime;

  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
    playTone(440, 0.05, 'square', 0.06);
  } else if (ball.x + ball.radius >= canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.vx = -Math.abs(ball.vx);
    playTone(440, 0.05, 'square', 0.06);
  }

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
    playTone(520, 0.05, 'sine', 0.06);
  }

  const paddle = gameState.paddle;
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.vy > 0
  ) {
    ball.y = paddle.y - ball.radius;
    ball.vy = -Math.abs(ball.vy);
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.vx = hitPos * 280;
    playTone(820, 0.06, 'triangle', 0.08);
  }

  if (ball.y - ball.radius > canvas.height) {
    endGame(false);
    return;
  }

  for (const brick of gameState.bricks) {
    if (!brick.alive) continue;
    if (
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    ) {
      const overlapLeft = (ball.x + ball.radius) - brick.x;
      const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
      const overlapTop = (ball.y + ball.radius) - brick.y;
      const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft || minOverlap === overlapRight) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }

      hitBrick(brick);
      break;
    }
  }

  if (gameState.bricks.every((brick) => !brick.alive)) {
    endGame(true);
    return;
  }

  render();
  gameState.animationFrameId = window.requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    gameState.keys = { ...gameState.keys, left: true };
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    gameState.keys = { ...gameState.keys, right: true };
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') {
    gameState.keys = { ...gameState.keys, left: false };
  } else if (event.key === 'ArrowRight') {
    gameState.keys = { ...gameState.keys, right: false };
  }
});

startButton.addEventListener('click', () => {
  if (!gameState.active) {
    startGame();
  }
});

render();
