// FEATURES

// appears in X sheds
// group selection into class or list

const agentMenuEl = document.querySelector('.agentMenu');
const agentMenuItemListEls = document.querySelectorAll('.agentMenu__item');
const selectionBoxEl = document.querySelector('.selectionBox');
const mapEl = document.querySelector('.map')

window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
window.addEventListener('keypress', handleKeyPress)

agentMenuItemListEls.forEach((item) => {
  item.addEventListener('mouseup', handleMouseUpAgentMenuItem);
})

const mementos = [];

let canvasState = {
  currentType: 'concept',
  x: 0,
  y: 0,
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2,
  isMouseDown: false,
  isAgentDragging: false,
  isCanvasDragging: false,
  isAltKey: false,
  isSelecting: false,
  mouseX: window.innerWidth / 2,
  mouseY: window.innerHeight / 2,
  mouseMoveX: 0,
  mouseMoveY: 0,
  mouseDownX: window.innerWidth / 2,
  mouseDownY: window.innerHeight / 2,
  startAgent: undefined,
  endAgent: undefined,
  activeAgent: undefined,
  agentList: [],
  relationshipList: [],
  selectedList: [],
}

function hideAgentMenu() {
  document.body.classList.remove('isAgentMenu');
}

function handleMouseUpAgentMenuItem(e) {
  e.stopPropagation();
  canvasState.isMouseDown = false;
  const item = e.currentTarget;
  createAgent(item.dataset.type);
  hideAgentMenu();
}

function handleKeyUp(e) {
  switch (e.key) {
    case 'Alt':
      canvasState.isAltKey = false;
      break;
    case 'Shift':
      canvasState.isShiftKey = false;
      break;
    case 'Control':
      canvasState.isCtrlKey = false;
      break;
    case 'Meta':
      canvasState.isMetaKey = false;
      break;  
    case ' ':
      document.body.classList.remove('isSpaceKey')
      canvasState.isSpaceKey = false;
      break;
    case 'Escape':
      removeEmpty()
      break;
    case 'Backspace':
      if (canvasState.selectedList.length > 1) {
        saveState();
        canvasState.selectedList.forEach((agent) => {
          removeAgent(agent);
        })
        canvasState.selectedList = [];
      }
      break;      
    case 'Enter':
      removeEmpty();
      if (canvasState.agentList.length > 0) {
        canvasState.mouseDownX = document.body.getBoundingClientRect().width / 2 + Math.cos(canvasState.agentList.length / Math.PI * 2) * 200 - canvasState.x;
        canvasState.mouseDownY = document.body.getBoundingClientRect().height / 2 + Math.sin(canvasState.agentList.length / Math.PI * 2) * 200 - canvasState.y;
      }
      clearSelectedList()
      createAgent(canvasState.currentType);
      break;   
    default:
      break;
  }
}

function handleKeyPress(e) {
  switch (e.key) {  
    case 'Enter':
      e.preventDefault();
      break;
    default:
      break;
  }
}

function removeEmpty() {
  const agent = document.activeElement.parentElement;
  const agentType = agent.classList.contains('agent') ? 'agent' : 'relationship';

  if (agent.innerText === '') {
    saveState();
    if (agentType === 'agent') {
      const agentIndex = canvasState.agentList.indexOf(agent);
      canvasState.agentList.splice(agentIndex, 1)
    }
    removeAgent(agent)
  }
}

function removeAgent(agent) {
  const relationshipMatches = getRelationshipMatches(agent)
  for (let i = canvasState.agentList.length; i > 0; i--) {
    if (agent === canvasState.agentList[i]) {
      canvasState.agentList.splice(i,1);
    }
  }
  if (relationshipMatches.length > 0) {
    for (let i = relationshipMatches.length; i > 0; i--) {
      if (relationshipMatches[i - 1] !== undefined) {
        canvasState.relationshipList[relationshipMatches[i - 1]][3].remove();
        canvasState.relationshipList[relationshipMatches[i - 1]][0][0].remove();
        canvasState.relationshipList[relationshipMatches[i - 1]][0][1].remove();
        canvasState.relationshipList.splice(i - 1,1);
      }
    }
  }

  agent.remove();
}

function getRelationshipMatches(agent) {
  return canvasState.relationshipList.map((rel, i) => {
    if (rel.includes(agent)) {
      return i;
    }
  })
}

function handleKeyDown(e) {
  switch (e.key) {
    case 'Alt':
      canvasState.isAltKey = true;
      break;
    case 'Shift':
      canvasState.isShiftKey = true;
      break;
    case 'Control':
      canvasState.isCtrlKey = true;
      break;
    case 'Meta':
      canvasState.isMetaKey = true;
      break;  
    case ' ':
      document.body.classList.add('isSpaceKey')
      canvasState.isSpaceKey = true;
      break;
    case 'z':
      if (e.metaKey) {
        const undo = confirm('you sure? this might delete stuff.');
        if (!undo) return;
        applyState(mementos[mementos.length - 1]);
      }
    default:
      break;
  }
}

function handleClickAgent(e) {
  e.stopPropagation();
  const matchIndex = canvasState.selectedList.indexOf(e.currentTarget);
  if (matchIndex === -1) {
    if (!e.metaKey && !e.shiftKey) {
      clearSelectedList();
    }
    canvasState.selectedList.push(e.currentTarget);
  } else if (!canvasState.isAgentDragging) {
    canvasState.selectedList[matchIndex].classList.remove('isSelected');
    canvasState.selectedList.splice(matchIndex, 1);
  }

  canvasState.selectedList.forEach((item) => {
    if (canvasState.selectedList.length > 1) {
      document.activeElement.blur();
    }
    item.classList.add('isSelected');
    item.isSelected = true;
  })
  canvasState.isAgentDragging = false;
}

function handleMouseDownAgent(e) {
  canvasState.startAgent = e.currentTarget;
  canvasState.activeAgent = e.currentTarget;
  e.stopPropagation();

  if (e.altKey) {
    e.preventDefault();
  }
}

function handleMouseEnterAgent(e) {

}

function handleMouseUpAgent(e) {
  canvasState.endAgent = e.currentTarget;
  if (canvasState.endAgent !== canvasState.startAgent && e.altKey){
    connectAgents();
  } else {
    e.stopPropagation();
  }
  setDefaultCanvasState();
  canvasState.activeAgent = e.currentTarget;
}

function handleMouseDown(e) {
  canvasState.isMouseDown = true;
  canvasState.mouseDownX = e.clientX - canvasState.x;
  canvasState.mouseDownY = e.clientY - canvasState.y;

  if (!e.metaKey && !e.shiftKey && !canvasState.isSpaceKey) {
    clearSelectedList();
  }

  setTimeout(() => {
    if (canvasState.isMouseDown && !canvasState.isCanvasDragging && !canvasState.isSelecting && !canvasState.isAgentDragging) {
      showAgentMenu(e);
    }
  }, 200)
}

function handleMouseMove(e) {
  canvasState.mouseMoveX = e.clientX - canvasState.mouseX;
  canvasState.mouseMoveY = e.clientY - canvasState.mouseY;
  
  if (canvasState.startAgent && !e.altKey) {
    dragSelected();
  }

  if (canvasState.isMouseDown && canvasState.isSpaceKey) {
    dragCanvas();
  } 

  if (canvasState.isMouseDown && !e.altKey && !e.metaKey && !e.shiftKey && !canvasState.isSpaceKey) {
    if (!canvasState.isSelecting) {
      clearSelectedList();
      canvasState.isSelecting = true;
      document.body.classList.add('isSelecting');
      selectionBoxEl.style.left = `${canvasState.mouseX - canvasState.x}px`;
      selectionBoxEl.style.top = `${canvasState.mouseY - canvasState.y}px`;
    }
    dragSelectionBox();
  }

  applyLens(document.querySelectorAll('.agent__label'));
  applyLens(document.querySelectorAll('.relationship__label'));
  canvasState.mouseX = e.clientX;
  canvasState.mouseY = e.clientY;
}

function handleMouseUp() {
  setDefaultCanvasState()
}

function setDefaultCanvasState() {
  canvasState.isCanvasDragging = false;
  setTimeout(() => {
    canvasState.isAgentDragging = false;
  }, 100)
  canvasState.isMouseDown = false;
  canvasState.isSelecting = false;
  document.body.classList.remove('isSelecting');
  canvasState.startAgent = null;
  canvasState.endAgent = null;
  canvasState.activeAgent = null;
  hideAgentMenu();
}

function dragCanvas() {
  canvasState.isCanvasDragging = true;
  canvasState.x += canvasState.mouseMoveX;
  canvasState.y += canvasState.mouseMoveY;
  canvasState.centerX -= canvasState.mouseMoveX;
  canvasState.centerY -= canvasState.mouseMoveY;
  mapEl.style.transform = `translate(${canvasState.x}px, ${canvasState.y}px)`;
}

function dragSelected() {
  canvasState.isAgentDragging = true;
  canvasState.selectedList.forEach((agent) => {
    const agentX = Number(agent.x || 0) + Number(canvasState.mouseMoveX) * 1;
    const agentY = Number(agent.y || 0) + Number(canvasState.mouseMoveY) * 1;
    agent.x = agentX;
    agent.y = agentY;
    agent.style.transform = `translate(${agentX}px, ${agentY}px)`;
  })

  const matches = canvasState.relationshipList.filter((rel, i) => {
    const relMatches = canvasState.selectedList.map((agent) => {
      if (rel.includes(agent)) {
        return rel;
      }
    })
    return relMatches;
  })
  
  matches.forEach((rel, i) => {
    const startX = rel[1].getBoundingClientRect().left - canvasState.x;
    const startY = rel[1].getBoundingClientRect().top - canvasState.y;
    
    const endX = rel[2].getBoundingClientRect().left - canvasState.x;
    const endY = rel[2].getBoundingClientRect().top - canvasState.y;
    const distX = endX - startX
    const distY = endY - startY
    const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY,2));
    rel[0][0].setAttribute(`x2`, dist);
    rel[0][1].setAttribute(`x2`, dist);
    const relX = startX + (endX - startX) / 2;
    const relY = startY + (endY - startY) / 2;
    let angle = Math.atan2(endY - startY, endX - startX);
    rel[0][0].parentNode.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}rad)`;
    rel[0][0].parentNode.setAttribute('width', dist);
    rel[3].style.transform = `translate(${relX}px, ${relY}px) rotate(${angle}rad)`;
  })
}

function dragSelectionBox() {
  let transform = '';
  const width = canvasState.mouseX - canvasState.mouseDownX - canvasState.x;
  const height = canvasState.mouseY - canvasState.mouseDownY - canvasState.y;
  if (width < 0) {
    transform = 'scaleX(-1)';
  }
  if (height < 0) {
    transform += 'scaleY(-1)';
  }
  selectionBoxEl.style.width = `${Math.abs(width)}px`;
  selectionBoxEl.style.height = `${Math.abs(height)}px`;
  selectionBoxEl.style.transform = transform;

  const selectionRect = selectionBoxEl.getBoundingClientRect();
  
  canvasState.agentList.forEach((agent) => {
    const agentRect = agent.querySelector('.agent__label').getBoundingClientRect()
    if (selectionRect.right > agentRect.left && selectionRect.left < agentRect.right && selectionRect.bottom > agentRect.top && selectionRect.top < agentRect.bottom) {
      if (!agent.isSelected) {
        agent.isSelected = true;
        canvasState.selectedList.push(agent);
        agent.classList.add('isSelected');
      }
    } else {
      agent.isSelected = false;
      agent.classList.remove('isSelected');
    }
  })
}

function applyLens(agentList) {
  // agentList.forEach((agent) => {
  //   const x = agent.parentNode.getBoundingClientRect().left - canvasState.x;
  //   const y = agent.parentNode.getBoundingClientRect().top - canvasState.y;
  //   const distX = x - canvasState.mouseX + canvasState.x;
  //   const distY = y - canvasState.mouseY + canvasState.y;
  //   const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
  //   const scale = Math.max(0.3, 1 - dist * 0.001);
  //   const blur = Math.min(10, dist * 0.004);
  //   // agent.style.filter = `blur(${blur}px)`;
  //   agent.style.transform = `scale(${scale})`;
  // })
  // canvasState.relationshipList.forEach((rel) => {
  //   const agent = rel[0][0];
  //   const x = agent.parentNode.getBoundingClientRect().left - canvasState.x;
  //   const y = agent.parentNode.getBoundingClientRect().top - canvasState.y;
  //   const distX = x - canvasState.centerX;
  //   const distY = y - canvasState.centerY;
  //   const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
  //   const blur = Math.min(10, dist * 0.004);
  //   // agent.style.filter = `blur(${blur}px)`;
  // })
}

function clearSelectedList() {

  canvasState.selectedList.forEach((item) => {
    item.classList.remove('isSelected');
    item.isSelected = false;
  });
  canvasState.selectedList = [];
}

function handleMouseEnterAgent(e) {
  
}

function showAgentMenu(e) {
  const x = e.clientX;
  const y = e.clientY;
  canvasState.isMouseDown = false;
  agentMenuEl.style.transform = `translate(${x}px, ${y}px)`;
  document.body.classList.add('isAgentMenu');
}

function createAgent(type = canvasState.currentType, text = '', x = canvasState.mouseDownX, y = canvasState.mouseDownY, scale = 1, uuid, index) {
  if (index === undefined) {
    saveState();
  }
  canvasState.currentType = type || canvasState.currentType;
  const agentEl = document.createElement('div');
  agentEl.classList.add('agent');
  agentEl.classList.add(`agent--${type}`);
  const agentLabelEl = document.createElement('div');
  agentLabelEl.classList.add('agent__label');
  const distX = x - canvasState.centerX;
  const distY = y - canvasState.centerY;
  const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
  agentEl.uuid = uuid || self.crypto.randomUUID();
  
  agentEl.style.transform = `translate(${x}px, ${y}px)`;
  agentEl.scale = scale;
  agentEl.x = x;
  agentEl.y = y;
  agentEl.type = canvasState.currentType;
  let rotation = getRotation(agentEl.type);
  agentLabelEl.style.transform = `scale(${scale}) ${rotation}`;
  agentEl.label = text;
  agentLabelEl.contentEditable = true;
  agentLabelEl.innerText = text;
  agentEl.addEventListener('click', handleClickAgent);
  agentEl.addEventListener('mousedown', handleMouseDownAgent);
  agentEl.addEventListener('mouseenter', handleMouseEnterAgent);
  agentEl.addEventListener('mouseup', handleMouseUpAgent);
  agentEl.onwheel = function (e) {
    e.preventDefault();
  
    if (e.ctrlKey) {
      const scaleDelta = e.deltaY * 0.01;
      scaleAgent(scaleDelta, agentEl, agentLabelEl);
    }
  };
  
  agentEl.appendChild(agentLabelEl);
  mapEl.appendChild(agentEl);
  if (index !== undefined) {
    canvasState.agentList.splice(index, 1, agentEl);
  } else {
    canvasState.agentList.push(agentEl);
    agentLabelEl.focus();
  }
}

function getRotation(type) {
  let rotation = '';
  if (type === "concept") {
    rotation = "rotateX(54.75deg) rotateY(0deg) rotateZ(-315deg)";
  } else if (type === "book") {
    rotation = "rotateX(54.75deg) rotateY(0deg) rotateZ(-315deg)";
  } else if (type === "person") {
    rotation = "rotateY(-35.75deg) rotateZ(25deg) rotateX(330deg)";
  } else if (type === "organization") {
    rotation = "rotateY(35.75deg) rotateZ(-25deg) rotateX(330deg)";
  } else if (type === "place") {
    rotation = "rotateX(54.75deg) rotateY(0deg) rotateZ(315deg)";
  }
  return rotation;
}

function scaleAgent(delta, agent, label) {
  agent.scale -= delta;
  agent.scale = Math.max(0.6, agent.scale);
  const rotation = getRotation(agent.type);
  label.style.transform = `scale(${Math.round(agent.scale * 4) / 4}) ${rotation}`;
}

function connectAgents(index, text = '>') {
  const connectionEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const defsEl = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradientEl = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  const stop1El = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  const stop2El = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  const relationshipEl = document.createElement('div');
  const relationshipLabelEl = document.createElement('div');
  connectionEl.classList.add('connection');
  // connectionEl.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  const startX = canvasState.startAgent.getBoundingClientRect().left - canvasState.x;
  const startY = canvasState.startAgent.getBoundingClientRect().top - canvasState.y;
  const endX = canvasState.endAgent.getBoundingClientRect().left - canvasState.x;
  const endY = canvasState.endAgent.getBoundingClientRect().top - canvasState.y;
  const distX = endX - startX
  const distY = endY - startY
  const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY,2));
  connectionEl.setAttribute('width', dist);
  connectionEl.setAttribute('height', 1);
  const angle = Math.atan2(distY, distX);
  const scale = 1; //Math.max(0, 1 - dist * 0.001);
  const id = performance.now();
  const lineEl = new Line(0, 0, dist, 0, id);
  const relX = startX + distX / 2;
  const relY = startY + distY / 2;
  connectionEl.style.transformOrigin = `0 0`;
  connectionEl.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}rad)`;
  relationshipEl.classList.add('relationship');
  relationshipLabelEl.classList.add('relationship__label');
  relationshipLabelEl.innerText = text;
  relationshipLabelEl.contentEditable = true;
  relationshipEl.style.transform = `translate(${relX}px, ${relY}px) rotate(${angle}rad) scale(${scale})`;
  
  relationshipEl.appendChild(relationshipLabelEl);
  connectionEl.appendChild(lineEl[0]);
  connectionEl.appendChild(lineEl[1]);
  defsEl.appendChild(gradientEl);
  gradientEl.appendChild(stop1El);
  gradientEl.appendChild(stop2El);
  connectionEl.appendChild(defsEl);
  mapEl.appendChild(relationshipEl);
  mapEl.appendChild(connectionEl);
  const startBg = window.getComputedStyle(canvasState.startAgent.querySelector('.agent__label')).backgroundColor;
  const endBg = window.getComputedStyle(canvasState.endAgent.querySelector('.agent__label')).backgroundColor;
  relationshipLabelEl.style.borderColor = startBg;
  relationshipLabelEl.style.color = startBg;
  stop1El.setAttribute('stop-color', startBg);
  stop2El.setAttribute('stop-color', endBg);
  gradientEl.setAttribute('id', `lineGradient${id}`);
  gradientEl.setAttribute('x1', '0%');
  gradientEl.setAttribute('x2', '100%');
  gradientEl.setAttribute('y1', '0%');
  gradientEl.setAttribute('y2', '0%');
  stop1El.setAttribute('offset', '0%')
  stop2El.setAttribute('offset', '100%')
  
  const rel = [lineEl, canvasState.startAgent, canvasState.endAgent, relationshipEl, text];
  if (index !== undefined) {
    canvasState.relationshipList.splice(index, 1, rel);
  } else {
    canvasState.relationshipList.push(rel);
    relationshipLabelEl.focus();
    const range = document.createRange();
    range.selectNodeContents(relationshipLabelEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    saveState();
  }
}

const Line = function (startX, startY, endX, endY, id) {
  const lineEl = document.createElementNS("http://www.w3.org/2000/svg", 'line');
  lineEl.setAttribute('x1', startX);
  lineEl.setAttribute('y1', startY - 1);
  lineEl.setAttribute('x2', endX);
  lineEl.setAttribute('y2', endY + 1);
  lineEl.setAttribute('stroke', `black`);
  lineEl.setAttribute('stroke-width', '6');
  lineEl.setAttribute('stroke-linecap', 'rounded');

  const line2El = document.createElementNS("http://www.w3.org/2000/svg", 'line');
  line2El.setAttribute('x1', startX);
  line2El.setAttribute('y1', startY - 1);
  line2El.setAttribute('x2', endX);
  line2El.setAttribute('y2', endY + 1);
  line2El.setAttribute('stroke', `url(#lineGradient${id})`);
  line2El.setAttribute('stroke-width', '1');
  line2El.setAttribute('stroke-linecap', 'rounded');
  return [lineEl, line2El];
}

function saveState() {
  canvasState.agentList.forEach((agent, i) => {
    agent.label = agent.innerText;
  });
  canvasState.relationshipList.forEach((rel, i) => {
    rel[4] = rel[3].innerText;
  });
  
  const state = JSON.parse(JSON.stringify(canvasState));
  // structuredClone(canvasState)
  mementos.push(state);
  if (mementos.length > 100) {
    // mementos = mementos.slice(0,100);
  }
}

function applyState(state) {
  clearCanvas();
  canvasState = JSON.parse(JSON.stringify(state));
  canvasState.agentList.forEach((agent, i) => {
    createAgent(agent.type, agent.label, agent.x, agent.y, agent.scale, agent.uuid, i);
  })
  canvasState.x = 0;
  canvasState.y = 0;
  canvasState.centerX = window.innerWidth / 2;
  canvasState.centerY = window.innerHeight / 2;
  canvasState.mouseX = window.innerWidth / 2;
  canvasState.mouseY = window.innerHeight / 2;
  canvasState.mouseDownX = window.innerWidth / 2;
  canvasState.mouseDownY = window.innerHeight / 2;
  canvasState.mouseMoveX = 0;
  canvasState.mouseMoveY = 0;
  canvasState.startAgent = null;
  canvasState.endAgent = null;
  canvasState.isAgentDragging = false;
  
  canvasState.relationshipList.forEach((rel, i) => {
    canvasState.agentList.forEach((agent) => {
      if (agent.uuid === rel[1].uuid) {
        canvasState.startAgent = agent;
      }
      if (agent.uuid === rel[2].uuid) {
        canvasState.endAgent = agent;
        console.log(agent)
      }
    });
    connectAgents(i, rel[4]);
  })

  canvasState.selectedList = [];

  dragCanvas()
}

function clearCanvas() {
  canvasState.agentList.forEach((agent) => {
    agent.remove();
    canvasState.agentList = [];
  })
  canvasState.relationshipList.forEach((rel) => {
    rel.forEach((el, i) => {
      if (i === 0) {
        el[0].remove();
        el[1].remove();
      } else if (i < 4) {
        el.remove()
      }
    })
  })
  
  canvasState = null;
}

document.querySelector('.shedsSelect').addEventListener('change', (e) => {
  const destroy = confirm('you sure? this will destroy the current shed.');
  if (!destroy) return;
  sheds.forEach((shed) => {
    if (shed.name === e.target.value) {
      console.log(shed)
      applyState(shed);
    }
  })
})