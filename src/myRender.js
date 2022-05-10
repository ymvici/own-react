export const myRenderOld = (element, container) => {
  // 根据elemet中的type生成对应dom节点, 当 element 类型是 TEXT_ELEMENT 的时候我们创建一个 text 节点而不是普通的节点。
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  // 循环遍历将子元素也添加到对应父级容器中
  element.props.children.forEach((child) => {
    /**
     * 一旦开始渲染，在我们将 react element 数渲染出来之前没法暂停。
     * 如果这颗树很大，可能会对主线程进行阻塞。
     * 这意味着浏览器的一些高优先级任务会一直等待渲染完成，
     * 如：用户输入，保证动画顺畅。
     */
    /**
     * 因此我们需要将整个任务分成一些小块，每当我们完成其中一块之后需要把控制权交给浏览器，
     * 让浏览器判断是否有更高优先级的任务需要完成。
     */
    myRenderOld(child, dom);
  });
  // 将elemet的属性放入到dom节点上
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  // 将生成的节点添加到容器中
  container.appendChild(dom);
};
// 生成对应的jsx dom对象
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });
  return dom;
}

// fiber的开始
export function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 在每一个 fiber 节点上添加 alternate 属性用于记录旧 fiber 节点（上一个 commit 阶段使用的 fiber 节点）的引用。
    alternate: currentRoot,
  };
  deletions = [];
  // render 函数中我们把 nextUnitOfWork 置为 fiber 树的根节点。
  nextUnitOfWork = wipRoot;
}
// 下一次需要渲染的任务节点
let nextUnitOfWork = null;
// 记录修改dom内容的树
let wipRoot = null;
// 上次提交到 DOM 节点的 fiber 树
let currentRoot = null;
// 保存要移除的 dom 节点
let deletions = null;

function commitRoot() {
  // 提交变更到DOM上的时候，需要把这个数组中的fiber的变更（其实是移除 DOM）给提交上去。
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
// 当需要更新节点属性，不改变dom时调用
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 我们需要先设置渲染的第一个任务单元，然后开始循环。
function workLoop(deadline) {
  /**
   * 以下任意条件成立时，shouldYield会返回true
   * 时间片到期（默认5ms）
   * 更紧急任务插队
   */
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 当wiproot收集所有dom修改后，触发commit
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
// 我们使用 requestIdleCallback 作为一个循环。
// 你可以把 requestIdleCallback 类比成 setTimeout，
// 只不过这次是浏览器来决定什么时候运行回调函数，而不是 settimeout 里通过我们指定的一个时间。
// requestIdleCallback 还给了一个 deadline 参数。通过它来判断离浏览器再次拿回控制权还有多少时间。
requestIdleCallback(workLoop);

// performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
function performUnitOfWork(fiber) {
  // 根节点才会有dom，如果不是根节点就要创建dom，因为render将第一个任务设置为根节点并设置了dom属性
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 根节点没有父节点，将此时的fiber dom挂载到父节点上
  // 为防止在整颗树还没加载完成时，被浏览器中断，这里要把修改dom的记录保存到wipRoot上
  // if (fiber.parent) { 只有wipRoot上任务收集完成后才把整颗树挂载到实际dom上
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

// 这个函数会调和（reconcile）旧的 fiber 节点 和新的 react elements
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  // 然后为每个子节点创建对应的新的 fiber 节点。
  // 循环创建新的fiber任务单元，并设置其父节点和兄弟节点指向
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    /**
     * 以下是比较的步骤：
     * React使用 key 这个属性来优化 reconciliation 过程。
     * 比如, key 属性可以用来检测 elements 数组中的子组件是否仅仅是更换了位置。
     */
    // 1. 对于新旧节点类型是相同的情况，我们可以复用旧的 DOM，仅修改上面的属性
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props, // 类型和dom使用旧节点，props使用新节点属性
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE", // 添加effectTag，在commit阶段使用
      };
    }
    // 2.如果类型不同，意味着我们需要创建一个新的 DOM 节点
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT", // 标记其为 PLACEMENT
      };
    }
    // 3.如果类型不同，并且旧节点存在的话，需要把旧节点的 DOM 给移除
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}
