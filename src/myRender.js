export const myRender = (element, container) => {
  // 根据elemet中的type生成对应dom节点, 当 element 类型是 TEXT_ELEMENT 的时候我们创建一个 text 节点而不是普通的节点。
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  // 循环遍历将子元素也添加到对应父级容器中
  element.props.children.forEach((child) => {
    myRender(child, dom);
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
