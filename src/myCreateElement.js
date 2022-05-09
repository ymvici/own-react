// 1.需要根据传入的参数生成新的jsx对象
export const myCreateElement = (type, attribute, ...childrens) => {
  console.log("~ childrens", childrens);
  return {
    type,
    props: {
      ...attribute,
      children: childrens.map((child) => {
        // children 数组中也可能有像 strings、numbers 这样的基本值。
        // 因此我们对所有不是对象的值创建一个特殊类型 TEXT_ELEMENT。
        return typeof child === "object" ? child : createNotOejcetChild(child);
      }),
    },
  };
};
/*
 * React 对于一个基本值的子元素，不会创建空数组也不会包一层 TEXT_ELEMENT，
 * 但是为了简化代码，我们的实现和 React 有差异，毕竟在这里我们只想要简单的代码而不是完美的代码
 */
const createNotOejcetChild = (child) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: child,
      children: [],
    },
  };
};
