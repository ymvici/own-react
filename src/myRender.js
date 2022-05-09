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

let nextUnitOfWork = null;
/**
 * 我们需要先设置渲染的第一个任务单元，然后开始循环。
 */
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
// performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
