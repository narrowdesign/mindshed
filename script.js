window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
window.addEventListener('keypress', handleKeyPress)

const agentMenuEl = document.querySelector('.agentMenu');
const agentMenuItemListEls = document.querySelectorAll('.agentMenu__item');

agentMenuItemListEls.forEach((item) => {
  item.addEventListener('mouseup', handleMouseUpAgentMenuItem);
})

const canvasState = {
  currentType: 'idea',
  x: 0,
  y: 0,
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2,
  isMouseDown: false,
  isAgentDragging: false,
  isCanvasDragging: false,
  isAltKey: false,
  mouseX: window.innerWidth / 2,
  mouseY: window.innerHeight / 2,
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
  console.log(e.key)
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
    case 'Escape':
      removeEmpty()
      break;
    case 'Enter':
      removeEmpty();
      if (canvasState.agentList.length > 0) {
        canvasState.mouseDownX = document.body.getBoundingClientRect().width / 2 + Math.cos(canvasState.agentList.length / Math.PI * 2) * 200;
        canvasState.mouseDownY = document.body.getBoundingClientRect().height / 2 + Math.sin(canvasState.agentList.length / Math.PI * 2) * 200;
      }
      createAgent();
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

function handleMouseUp(e) {
  canvasState.isCanvasDragging = false;
  canvasState.isAgentDragging = false;
  canvasState.isMouseDown = false;
  canvasState.startAgent = null;
  canvasState.endAgent = null;
  canvasState.activeAgent = null;
  hideAgentMenu();
}

function removeEmpty() {
  const activeAgent = document.activeElement.parentElement;
  const matches = canvasState.relationshipList.filter((rel, i) => {
    if (rel.includes(activeAgent)) {
      return i;
    }
  })
  if (matches.length > 1) return;
  if (activeAgent.innerText === '') {
    canvasState.relationshipList.splice(matches[0],1);
    if (activeAgent.nextElementSibling && activeAgent.nextElementSibling.classList.contains('connection')) {
      activeAgent.nextElementSibling.remove();
    }
    activeAgent.remove();
  }
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
      canvasState.isCmdKey = true;
      break;      
    default:
      break;
  }
}

function handleClickAgent(e) {
  e.stopPropagation();
  const matchIndex = canvasState.selectedList.indexOf(e.currentTarget);

  if (matchIndex === -1) {
    if (!canvasState.isCmdKey && !canvasState.isShiftKey) {
      clearSelectedList();
    }
    canvasState.selectedList.push(e.currentTarget);
  } else {
    canvasState.selectedList[matchIndex].classList.remove('isSelected');
    canvasState.selectedList.splice(matchIndex, 1);
  }

  canvasState.selectedList.forEach((item) => {
    item.classList.add('isSelected');
  })
}

function handleMouseDownAgent(e) {
  canvasState.startAgent = e.currentTarget;
  canvasState.activeAgent = e.currentTarget;
  e.stopPropagation();

  if (canvasState.isAltKey) {
    e.preventDefault();
  }
}

function handleMouseEnterAgent(e) {

}

function handleMouseUpAgent(e) {
  canvasState.endAgent = e.currentTarget;
  if (canvasState.endAgent !== canvasState.startAgent){
    connectAgents();
  } else {
    e.stopPropagation();
  }
  canvasState.isMouseDown = false;
  canvasState.activeAgent = null;
  canvasState.startAgent = null;
  canvasState.endAgent = null;
}

function handleMouseDown(e) {
  canvasState.isMouseDown = true;
  canvasState.mouseDownX = e.pageX - canvasState.x;
  canvasState.mouseDownY = e.pageY - canvasState.y;
  clearSelectedList();

  setTimeout(() => {
    if (canvasState.isMouseDown && !canvasState.isCanvasDragging && !canvasState.isAgentDragging) {
      showAgentMenu(e);
    }
  }, 200)
}

function handleMouseMove(e) {
  const mouseMoveX = e.pageX - canvasState.mouseX;
  const mouseMoveY = e.pageY - canvasState.mouseY;
  
  if (canvasState.startAgent && !canvasState.isAltKey) {
    canvasState.selectedList.forEach((agent) => {
      const agentX = Number(agent.dataset.x || 0) + Number(mouseMoveX) * 1;
      const agentY = Number(agent.dataset.y || 0) + Number(mouseMoveY) * 1;
      agent.dataset.x = agentX;
      agent.dataset.y = agentY;
      agent.style.transform = `translate(${agentX}px, ${agentY}px)`;
    })

    const matches = canvasState.relationshipList.filter((rel, i) => {
      if (rel.includes(canvasState.startAgent)) {
        return rel;
      }
    })
    matches.forEach((rel, i) => {
      const startX = rel[1].getBoundingClientRect().left - canvasState.x;
      const startY = rel[1].getBoundingClientRect().top - canvasState.y;
      
      const endX = rel[2].getBoundingClientRect().left - canvasState.x;
      const endY = rel[2].getBoundingClientRect().top - canvasState.y;
      const distX = endX - startX
      const distY = endY - startY
      const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY,2));
      rel[0].setAttribute(`x2`, dist);
      const relX = startX + (endX - startX) / 2;
      const relY = startY + (endY - startY) / 2;
      let angle = Math.atan2(endY - startY, endX - startX);
      rel[0].parentNode.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}rad)`;
      rel[0].parentNode.setAttribute('width', dist);
      rel[3].style.transform = `translate(${relX}px, ${relY}px) rotate(${angle}rad)`;
    })
  }
  if (canvasState.isMouseDown && !canvasState.isAgentDragging) {
    canvasState.x += mouseMoveX;
    canvasState.y += mouseMoveY;
    canvasState.centerX -= mouseMoveX;
    canvasState.centerY -= mouseMoveY;
    document.body.style.transform = `translate(${canvasState.x}px, ${canvasState.y}px)`;
    applyLens(document.querySelectorAll('.agent__label'));
    applyLens(document.querySelectorAll('.relationship__label'));
  }
  if (canvasState.startAgent) {
    canvasState.isAgentDragging = true;
    applyLens([...canvasState.selectedList.map((item) => item.querySelector('.agent__label'))])
  } else if (canvasState.isMouseDown) {
    canvasState.isCanvasDragging = true;
  }
  canvasState.mouseX = e.pageX;
  canvasState.mouseY = e.pageY;
}

function applyLens(agentList) {
  agentList.forEach((agent) => {
    const x = agent.parentNode.getBoundingClientRect().left - canvasState.x;
    const y = agent.parentNode.getBoundingClientRect().top - canvasState.y;
    const distX = x - canvasState.centerX;
    const distY = y - canvasState.centerY;
    const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    const scale = Math.max(0, 1 - dist * 0.001);
    const blur = Math.min(10, dist * 0.004);
    // agent.style.filter = `blur(${blur}px)`;
    agent.style.transform = `scale(${scale})`;
  })
  canvasState.relationshipList.forEach((rel) => {
    const agent = rel[0];
    const x = agent.parentNode.getBoundingClientRect().left - canvasState.x;
    const y = agent.parentNode.getBoundingClientRect().top - canvasState.y;
    const distX = x - canvasState.centerX;
    const distY = y - canvasState.centerY;
    const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    const blur = Math.min(10, dist * 0.004);
    // agent.style.filter = `blur(${blur}px)`;
  })
}

function clearSelectedList() {

  canvasState.selectedList.forEach((item) => {
    item.classList.remove('isSelected');
  });
  canvasState.selectedList = [];
}

function handleMouseEnterAgent(e) {
  
}

function showAgentMenu(e) {
  const x = e.pageX - canvasState.x;
  const y = e.pageY - canvasState.y;
  canvasState.isMouseDown = false;
  agentMenuEl.style.transform = `translate(${x}px, ${y}px)`;
  document.body.classList.add('isAgentMenu');
}

function createAgent(type = canvasState.currentType) {
  canvasState.currentType = type;
  const agentEl = document.createElement('div');
  agentEl.classList.add('agent');
  agentEl.classList.add(`agent--${type}`);
  const agentLabelEl = document.createElement('div');
  agentLabelEl.classList.add('agent__label');
  const x = canvasState.mouseDownX;
  const y = canvasState.mouseDownY;
  const distX = x - canvasState.centerX;
  const distY = y - canvasState.centerY;
  const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
  const scale = Math.max(0, 1 - dist * 0.001);
  const blur = Math.min(10, dist * 0.003);
  
  agentEl.style.transform = `translate(${x}px, ${y}px)`;
  // agentLabelEl.style.filter = `blur(${blur}px)`
  agentLabelEl.style.transform = `scale(${scale})`;
  agentEl.dataset.x = x;
  agentEl.dataset.y = y;
  agentLabelEl.contentEditable = true;
  agentEl.addEventListener('click', handleClickAgent);
  agentEl.addEventListener('mousedown', handleMouseDownAgent);
  agentEl.addEventListener('mouseenter', handleMouseEnterAgent);
  agentEl.addEventListener('mouseup', handleMouseUpAgent);
  
  agentEl.appendChild(agentLabelEl);
  document.body.appendChild(agentEl);
  canvasState.agentList.push(agentEl);
  agentLabelEl.focus();
}

function connectAgents() {
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
  const scale = Math.max(0, 1 - dist * 0.001);
  const id = performance.now();
  const lineEl = new Line(0, 0, dist, 0, id);
  const relX = startX + distX / 2;
  const relY = startY + distY / 2;
  connectionEl.style.transformOrigin = `0 0`;
  connectionEl.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}rad)`;
  relationshipEl.classList.add('relationship');
  relationshipLabelEl.classList.add('relationship__label');
  relationshipLabelEl.contentEditable = true;
  relationshipEl.style.transform = `translate(${relX}px, ${relY}px) rotate(${angle}rad) scale(${scale})`;
  canvasState.relationshipList.push([lineEl, canvasState.startAgent, canvasState.endAgent, relationshipEl]);
  
  relationshipEl.appendChild(relationshipLabelEl);
  connectionEl.appendChild(lineEl);
  defsEl.appendChild(gradientEl);
  gradientEl.appendChild(stop1El);
  gradientEl.appendChild(stop2El);
  connectionEl.appendChild(defsEl);
  document.body.appendChild(relationshipEl);
  document.body.appendChild(connectionEl);
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
  
  relationshipLabelEl.focus();
}

const Line = function (startX, startY, endX, endY, id) {
  const lineEl = document.createElementNS("http://www.w3.org/2000/svg", 'line');
  lineEl.setAttribute('x1', startX);
  lineEl.setAttribute('y1', startY - 1);
  lineEl.setAttribute('x2', endX);
  lineEl.setAttribute('y2', endY + 1);
  lineEl.setAttribute('stroke', `url(#lineGradient${id})`);
  lineEl.setAttribute('stroke-width', '3');
  lineEl.setAttribute('stroke-linecap', 'rounded');
  return lineEl;
}
