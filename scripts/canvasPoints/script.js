let map = localStorage.getItem('map') || 'bigmap';
let static = localStorage.getItem('static') === 'true' || false;

const colorMap = {
  // Lighthouse Tunnel
  '65ca29cd-d60a-458b-b588-6e898b8c060d': 'green',
  'ced7d497-d16a-41d4-8caf-7c515c28ccdb': 'green',
  'f519a18e-0583-4d8d-b5c6-de9d75699312': 'green',
  '27643426-5933-4ba9-a5dd-04b40c8e33e2': 'green',
  '2854bc78-ceaa-401f-bf71-e41de72e0052': 'green',
  // Shoreline left
  '698b0cea-682d-44e8-9e5e-35bbcb29acb9': 'green',
  '58474a2e-3915-4fd5-b6e1-5fc4a581c2f2': 'green',
  '08475ee7-0dfb-4e8e-82c8-e40283ee7d6c': 'green',
  'b135a5e9-ed2e-4050-a17e-e9cbebcec1d2': 'green',
  '3eddbe61-12b7-4bc2-aa73-2087c2eb9f2b': 'green',
  // Shoreline right
  '3fd55f19-ef15-4017-b468-cff2d9fe9b35': 'blue',
  '373f1d18-1627-415d-8f9f-0acf5d415f4b': 'blue',
  'c5425f62-ced4-4198-9a77-dc186b09fee9': 'blue',
  '04a50f48-34c2-4e5d-9714-06988624c36a': 'blue',
  'bf0c91c9-6ee4-4fd3-8f03-9c02d79355ce': 'blue',
  // Reserve left
  'cd1ecd67-b353-41a3-864f-685b27d0cb96': 'green',
  'd91a39ba-2c87-4cc0-8203-82f91d607526': 'green',
  '85485da0-9a38-41c6-b322-d3f18520c484': 'green',
  '0a5669a9-4221-4e76-b4ac-67ea8c8bfc7e': 'green',
  '8a9c0e57-c784-497c-a215-1c45b6256f8a': 'green',
  // Reserve right
  '7fce3e48-e5eb-4db4-9c45-9f063aea47b7': 'blue',
  // Reserve middle
  '6159ed20-e29b-45f3-8910-b8f20c40fe18': 'blueviolet',
  '8f95ec4e-cdb4-40f6-8e95-1bc0e90f74dc': 'blueviolet',
  '400cfcd7-5776-467a-b7eb-8b0f9819f7d6': 'blueviolet',
  '74e240c1-45b8-4f62-a5a1-aa4cd2729df6': 'blueviolet',
  '741a7272-8fe2-4d4b-a4d6-1f7a34995f88': 'blueviolet',
  // Reserve top left
  'b7247acd-a58d-4c8f-887a-c8ac50d94b67': 'yellow',
  '503cb253-c40e-45ea-a820-37f45a521c98': 'yellow',
  '14afdaf7-3bc8-4930-a982-a6ee62011177': 'yellow',
  'a42a953a-2ccc-4acd-9427-dbcc85dc9694': 'yellow',
  '31b28d9e-82c9-40fe-aba4-9199c6a59bc5': 'yellow',
  // Labs bottom right
  '6e2cf61e-85a6-4cfa-b232-ae4cd892e4e0': 'green',
  '037b1766-b66b-4c3e-adf1-390f67dc70bb': 'green',
  'ad74c165-363f-4706-999c-2d33396865e4': 'green',
  '9ad6d872-4797-47a9-a5a6-b4675b478913': 'green',
  '08633a18-3bbd-4a4b-934a-b51e049817b1': 'green',
  // Labs middle left
  'dd19a5a1-b24b-4b4c-b0ff-12567bc35c48': 'blue',
  '5efaabad-3df0-451c-ae8c-df707c90d24f': 'blue',
  '3d6df899-9a65-48d3-9e55-2664c6c6c4c0': 'blue',
  'b71e139d-c363-4b9a-b87e-1a6bef552641': 'blue',
  '5aed643f-3714-49fc-bdf8-00168189da61': 'blue',
  // Labs top right
  '604f6db8-2519-42b8-8d45-7b1b1290e97d': 'yellow',
  'bf1d14c2-2c9b-4921-8534-76c1ae9430dc': 'yellow',
  '01d14f42-45de-45fb-be52-bfff19f3a470': 'yellow',
  '707edb2a-0cbb-4c12-9fc5-49a34af4779d': 'yellow',
  '63a12c08-6718-4344-b9c4-d9c2b0550faa': 'yellow',
};

// Labs 1F: 1306, 1922
// Labs TF: 44  , 1168
// Labs 2F: 2566, 1106

// To TF:  -1262, -756
// To 2F:  +1260, -816

const imagesPath = '../../electron/src/client/public/images';
const canvas = document.getElementById('canvas');
const closeDiv = document.getElementById('close');
const select = document.getElementById('map-select');
const staticCheckbox = document.getElementById('static');

let spawns,
  realMaxX,
  realMinX,
  realMaxZ,
  realMinZ,
  minX,
  maxX,
  minZ,
  maxZ,
  shiftX,
  shiftZ,
  zoomX,
  zoomZ,
  lerpType,
  swapAxis,
  closenessThreshold;
let selectedIds = [];
function init() {
  spawns = window.spawns[map];
  canvas.style.backgroundImage = `url('${imagesPath}/${map}.png')`;
  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    draw();
  };
  img.src = `${imagesPath}/${map}.png`;

  realMinX = Math.min(...spawns.map(s => s.Position.z));
  minX = realMinX;
  realMaxX = Math.max(...spawns.map(s => s.Position.z));
  maxX = realMaxX;
  realMinZ = Math.min(...spawns.map(s => s.Position.x));
  minZ = realMinZ;
  realMaxZ = Math.max(...spawns.map(s => s.Position.x));
  maxZ = realMaxZ;

  select.value = map;
  staticCheckbox.checked = static;
  selectedIds = [];
  if (window.params?.[map]) {
    shiftX = window.params[map].shiftX;
    shiftZ = window.params[map].shiftZ;
    zoomX = window.params[map].zoomX;
    zoomZ = window.params[map].zoomZ;
    lerpType = window.params[map].lerpType;
    swapAxis = window.params[map].swapAxis;
  } else {
    shiftX = 0;
    shiftZ = 0;
    zoomX = 1;
    zoomZ = 1;
    lerpType = 0;
    swapAxis = false;
  }
  closenessThreshold = 50 ** 2;
  minX = realMinX - zoomX;
  maxX = realMaxX + zoomX;
  minZ = realMinZ - zoomZ;
  maxZ = realMaxZ + zoomZ;
  draw();
}
init();

select.addEventListener('change', async () => {
  const { value } = select;
  map = value;
  localStorage.setItem('map', value);
  init();
});
staticCheckbox.addEventListener('change', async () => {
  const { checked } = staticCheckbox;
  static = checked;
  localStorage.setItem('static', checked);
});

const mouseEventHandler = (e) => {
  draw(e);
};
canvas.addEventListener('mousemove', (e) => mouseEventHandler(e));
canvas.addEventListener('mousedown', (e) => mouseEventHandler(e));
canvas.addEventListener('mouseup', (e) => mouseEventHandler(e));
canvas.addEventListener('wheel', (e) => {
  if (static) {
    closenessThreshold -= e.deltaY * (e.shiftKey ? 2 : 10);
  } else {
    const delta = e.deltaY / (e.shiftKey ? 100 : 10);
    if (e.altKey) {
      zoomZ += delta;
    } else {
      zoomX += delta;
    }
    minX = realMinX - zoomX;
    maxX = realMaxX + zoomX;
    minZ = realMinZ - zoomZ;
    maxZ = realMaxZ + zoomZ;
  }
  draw(e);
});

document.addEventListener('keydown', (e) => {
  if (static) return;
  if (e.key === '1') lerpType++;
  lerpType %= 4;
  if (e.key === '2') swapAxis = !swapAxis;
  draw();
});

let lastMouseX = 0;
let lastMouseY = 0;
let isMouseDown = false;
function draw(event) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let mouseX = 0;
  let mouseY = 0;
  if (event) {
    mouseX = event.x;
    mouseY = event.y;
    mouseX -= canvas.offsetLeft;
    mouseY -= canvas.offsetTop;
    mouseX = lerp(0, canvas.width, mouseX / canvas.clientWidth);
    mouseY = lerp(0, canvas.height, mouseY / canvas.clientHeight);
    if (event.type === 'mousedown') {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      isMouseDown = true;
    }
    if (event.type === 'mouseup') {
      isMouseDown = false;
      if (!static)
        navigator.clipboard.writeText(`
      ${map}: {
        shiftX: ${shiftX},
        shiftZ: ${shiftZ},
        zoomX: ${zoomX},
        zoomZ: ${zoomZ},
        lerpType: ${lerpType},
        swapAxis: ${swapAxis},
      },`);
    }
    if (event.type === 'mousemove' && isMouseDown && !static) {
      shiftX += mouseX - lastMouseX;
      shiftZ += mouseY - lastMouseY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }
  if (static)
    console.log(Number(mouseX).toFixed(0), Number(mouseY).toFixed(0));

  for (const spawn of spawns) {
    const [x, y] = worldToScreen(spawn.Position);
    let color = colorMap[spawn.Id] || 'red';
    if (selectedIds.includes(spawn.Id)) {
      color = 'green';
    }
    drawCircle(ctx, x + shiftX, y + shiftZ, 15, color);
  }
  if (!static)
    console.log(shiftX, shiftZ, zoomX, zoomZ, lerpType, realMinX - minX, realMaxX - maxX, realMinZ - minZ, realMaxZ - maxZ);

  if (static) {
    const closePoints = spawns.filter(s => {
      const [x, y] = worldToScreen(s.Position);
      return distance2(x + shiftX, y + shiftZ, mouseX, mouseY) < closenessThreshold;
    });

    for (const spawn of closePoints) {
      const [x, y] = worldToScreen(spawn.Position);
      drawCircle(ctx, x + shiftX, y + shiftZ, 15, colorMap[spawn.Id] || 'black', 10);
    }
    if (event?.type === 'mousedown') {
      selectedIds = closePoints.map(s => s.Id);
      closeDiv.innerText = JSON.stringify(selectedIds);
      const sumXY = closePoints.reduce(([accX, accY], s) => {
        const [x, y] = worldToScreen(s.Position);
        return [accX + x + shiftX, accY + y + shiftZ];
      }, [0, 0]);
      const avgX = Number(sumXY[0] / closePoints.length).toFixed(0);
      const avgY = Number(sumXY[1] / closePoints.length).toFixed(0);
      closeDiv.innerText += `\n"x": ${avgX},\n"y": ${avgY}`;
      navigator.clipboard.writeText(`\n        "x": ${Number(avgX).toFixed(0)},\n        "y": ${Number(avgY).toFixed(0)}`).then(() => {
        setTimeout(() => navigator.clipboard.writeText('(' + selectedIds.join('|') + ')'), 300);
      }).catch(() => {
        setTimeout(() => navigator.clipboard.writeText('(' + selectedIds.join('|') + ')'), 300);
      });
    }
  }
}

function drawCircle(ctx, x, y, radius = 30, color = '#ff0000', lineWidth = 0) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fill();
  }
  ctx.closePath();
}

function distance2(x1, y1, x2, y2) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

// function to convert world coordinates to screen coordinates
function worldToScreen({ x, y, z }) {
  if (swapAxis) [x, z] = [z, x];
  const tX = (x - minX) / (maxX - minX);
  const tZ = (z - minZ) / (maxZ - minZ);
  if (lerpType === 0) [x, z] = [lerp(0, canvas.width, tX), lerp(0, canvas.height, tZ)];
  if (lerpType === 1) [x, z] = [lerp(canvas.width, 0, tX), lerp(0, canvas.height, tZ)];
  if (lerpType === 2) [x, z] = [lerp(0, canvas.width, tX), lerp(canvas.height, 0, tZ)];
  if (lerpType === 3) [x, z] = [lerp(canvas.width, 0, tX), lerp(canvas.height, 0, tZ)];
  if (map === 'laboratory') {
    if (y < -3) {
      x -= 1262;
      z -= 756;
    }
    if (y > 3) {
      x += 1260;
      z -= 816;
    }
  }
  return [x, z];
}

function lerp(a, b, t) {
  return a + t * (b - a);
}
