/** @jsxRuntime classic */
import { myCreateElement } from "./myCreateElement";
import { myRenderOld } from "./myRender";

/** @jsx myCreateElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from myCreateElement</h2>
  </div>
);
myRenderOld(element, document.getElementById("root"));
