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
// performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
export function performUnitOfWorkOld(fiber) {
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
  let index = 0;
  let prevSibling = null;
  // 然后为每个子节点创建对应的新的 fiber 节点。
  // 循环创建新的fiber任务单元，并设置其父节点和兄弟节点指向
  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
  // 这个函数的返回值是下一个任务，这其实是一个深度优先遍历
  // 先找子元素，没有子元素了就找兄弟元素
  // 兄弟元素也没有了就返回父元素
  // 然后再找这个父元素的兄弟元素
  // 最后到根节点结束
  // 这个遍历的顺序其实就是从上到下，从左到右
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
