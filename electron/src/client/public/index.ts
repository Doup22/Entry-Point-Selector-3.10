import { Config, LocationId, Locations, Position, PositionMap } from '../../types';

let config: Config = {} as any;
let positionMaps: Locations = {} as any;
let positionMap: PositionMap[] = [] as any;
const select = document.getElementById('map-select') as HTMLSelectElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const status = document.getElementById('status') as HTMLSpanElement;

let debounce = false;
let scheduledEvent: MouseEvent | undefined;
async function init() {
  positionMaps = await window.electron.getPositionMaps();
  config = await window.electron.getConfig();
  positionMap = positionMaps[config.lastMap];

  select.value = config.lastMap;
  select.addEventListener('change', () => setMap(select.value));
  window.electron.onMapChange((event, map) => {
    select.value = map;
    setMap(map);
  });

  const onlyOnce = document.getElementById('only-once') as HTMLInputElement;
  const autoOpen = document.getElementById('auto-open') as HTMLInputElement;
  const disabled = document.getElementById('disabled') as HTMLInputElement;
  const darkTheme = document.getElementById('dark-theme') as HTMLInputElement;
  autoOpen.checked = config.autoOpen;
  onlyOnce.checked = config.onlyOnce;
  disabled.checked = config.disabled;
  darkTheme.checked = localStorage.getItem('dark-theme') === 'true';
  if (darkTheme.checked) {
    document.body.classList.add('dark');
  }

  autoOpen.addEventListener('change', async () => {
    const { checked } = autoOpen;
    config = await window.electron.changeAutoOpen(checked);
  });
  onlyOnce.addEventListener('change', async () => {
    const { checked } = onlyOnce;
    config = await window.electron.changeOnlyOnce(checked);
  });
  disabled.addEventListener('change', async () => {
    const { checked } = disabled;
    config = await window.electron.changeDisabled(checked);
  });
  darkTheme.addEventListener('change', async () => {
    const { checked } = darkTheme;
    localStorage.setItem('dark-theme', checked ? 'true' : 'false');
    if (checked) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  });

  const mouseEventHandler = (e: MouseEvent) => {
    if (!debounce) draw(e);
    else scheduledEvent = e;
  };
  document.addEventListener('mousemove', (e) => mouseEventHandler(e));
  document.addEventListener('mousedown', (e) => mouseEventHandler(e));
  document.addEventListener('mouseup', (e) => mouseEventHandler(e));
  for (const elem of document.getElementById('hidden-images')!.children) {
    elem.addEventListener('load', () => setTimeout(() => {
      draw();
    }, 100));
  }

  draw();
}

setInterval(async () => {
  config = await window.electron.getConfig();
  draw();
}, 1000 * 60);

async function setMap(map: string) {
  config = await window.electron.changeMap(map as LocationId);
  positionMap = positionMaps[map];
  draw();
}

async function draw(event?: MouseEvent) {
  if (debounce) return;
  debounce = true;
  setTimeout(() => {
    debounce = false;
    if (scheduledEvent) {
      draw(scheduledEvent);
      scheduledEvent = undefined;
    }
  }, 30);
  const mapName = select.value as LocationId;
  let image: HTMLImageElement | undefined;
  for (const img of document.images) {
    if (img.src.endsWith(`${mapName}.png`)) {
      image = img;
      break;
    }
  }
  if (!image) return;

  const entryPointIds = config.maps[mapName];
  const selectedPoints: Position[] | undefined = entryPointIds?.length
    ? positionMap.filter(p => p.locations.find(l => entryPointIds.includes(l.id))).reduce((ret, curr) => {
      if (ret.find(p => p.x === curr.pixel.x && p.y === curr.pixel.y)) return ret;
      return [...ret, curr.pixel];
    }, [] as Position[])
    : undefined;
  status.innerText = selectedPoints?.length ? `${selectedPoints.length} point(s) selected` : 'No points selected. Will use all points.';

  const mapE = document.getElementById('map') as HTMLDivElement;
  let newWidth = image.width;
  let newHeight = image.height;
  let factor = 1;
  if (newWidth > newHeight) {
    if (newWidth > mapE.clientWidth) {
      const _factor = mapE.clientWidth / newWidth;
      newWidth *= _factor;
      newHeight *= _factor;
      factor *= _factor;
    }
  }
  if (newHeight > mapE.clientHeight - 20) {
    const _factor = (mapE.clientHeight - 20) / newHeight;
    newWidth *= _factor;
    newHeight *= _factor;
    factor *= _factor;
  }
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight);

  if (event) {
    let { x, y } = event;
    const { left, top, width, height } = canvas.getBoundingClientRect();
    x -= left;
    y -= top;
    if (!(x < 0 || x > width || y < 0 || y > height)) {
      x = x / width * image.width;
      y = y / height * image.height;
      if (event.type === 'mousedown') {
        navigator.clipboard.writeText(`\n        "x": ${Number(x).toFixed(0)},\n        "y": ${Number(y).toFixed(0)}`);
      }
      const threshold = 100;

      let closest: { distance: number, position: Position, location: string } | undefined;
      for (const location of positionMap) {
        const distance = Math.sqrt((location.pixel.x - x) ** 2 + (location.pixel.y - y) ** 2);
        if (!closest || distance < closest.distance) {
          closest = { distance, position: location.pixel, location: location.locations[0].id };
        }
      }
      drawEntryPoints(ctx, factor, selectedPoints, closest && closest.distance < threshold ? closest.position : undefined);
      if (closest && closest.distance < threshold) {
        if (event.type === 'mousedown') {
          (async () => {
            if (selectedPoints?.find(p => p.x === closest!.position.x && p.y === closest!.position.y)) {
              config = await window.electron.removeEntryPoint(mapName, closest.position);
            } else
              config = await window.electron.addEntryPoint(mapName, closest.position);
          })();
        }
        const { position } = closest;
        // console.log(position);
        drawCircle(ctx, position.x * factor, position.y * factor, 50 * factor, '#00ff00a0');
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      // console.log(Number(x).toFixed(0), Number(y).toFixed(0));
    } else {
      drawEntryPoints(ctx, factor, selectedPoints);
    }
  } else {
    drawEntryPoints(ctx, factor, selectedPoints);
  }
}

function drawEntryPoints(ctx: CanvasRenderingContext2D, factor: number, selected?: Position[], ignore?: Position) {
  const selectedPoints: Position[] = [];
  for (const { pixel } of positionMap) {
    if (ignore && pixel.x === ignore.x && pixel.y === ignore.y)
      continue;
    if (selected && selected.find(p => p.x === pixel.x && p.y === pixel.y)) {
      selectedPoints.push(pixel);
      continue;
    }
    drawCircle(ctx, pixel.x * factor, pixel.y * factor, 50 * factor, '#ff0000a0');
  }
  for (const selectedPoint of selectedPoints) {
    drawCircle(ctx, selectedPoint.x * factor, selectedPoint.y * factor, 50 * factor, '#00ff00a0', true, 10 * factor);
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, fill = true, lineWidth?: number) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) ctx.fill();
  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
  ctx.closePath();
}

init();
