let isMount = true; // 判断是否是第一次挂载
let workInProgressHook = null; // 用于保存当前正在处理哪个hook

const fiber = {
  stateNode: App,
  memoizedState: null, // 保存对应hook的数据，用链表保存，所以hook的调用顺序事不能改变的
};
function schedule() {
  workInProgressHook = fiber.memoizedState; // 每次调度将workInProgressHook重新指向第一个hook
  fiber.stateNode();
  isMount = false; // 第一次挂载完成后，将判断条件置为false
}

function useState(initialState) {
  let hook; // 用于判断是哪一个useState
  if (isMount) {
    // 初次渲染的时候,memoizedState是null，所以要给hook赋值
    hook = {
      memoizedState: initialState, // 用于保存调用useState的值
      next: null, // 指向下一个hook
      queue: {
        // 因为setState方法会被调用多次，所以要用队列保存该hook所有状态的改变
        panding: null,
      },
    };
    // 将hook用链表链接起来
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
      workInProgressHook = hook; // 将链表指针指向当前hook
    } else {
      // 当使用多个useState时，会进入，将workInProgressHook链接到当前hook
      workInProgressHook.next = hook;
    }
    // 更新workInProgressHook指向
    workInProgressHook = hook;
  } else {
    // 如果是更新数据，将hook指向当前正在处理的hook
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  // 计算新的state值
  let baseState = hook.memoizedState;
  // 如果panding有值，说明当前的state需要更新
  if (hook.queue.panding) {
    // 取出第一个更新state的操作,queue.panding保存着最后一个操作
    let firstUpdate = hook.queue.panding.next;
    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.panding.next);
    // 计算完state就将操作循环链表清空
    hook.queue.panding = null;
  }
  // 将数据赋值成新的state
  hook.memoizedState = baseState;
  return [baseState, dispatchAction.bind(null, hook.queue)];
}

// useState接受的改变state的函数
// 为了知道是哪一个hook调用的，所以要在hook上增加一个queue来保存当前处理的hook
function dispatchAction(queue, action) {
  // 保存本次更新的操作，
  const update = {
    action,
    // 可能存在多次改变state的操作，所以这里要保持一个指针，指向下一次改变state的操作
    next: null,
  };
  // 当前hook没有需要改变state的操作时，panding为null
  if (queue.pending === null) {
    // 所以此时的update就是需要触发的第一次更新
    // 使用环状链表，因为操作是有优先级的 u0 -> u0 -> u0
    update.next = update; // 自己指向自己，形成环状链表
  } else {
    // 当多次使用setState时，panding中有触发改变的数据，进入该逻辑
    //  u0 -> u0 => u1 -> u0 -> u1 => u2 -> u0 -> u1 -> u2
    // u1就是update，先将u1的next指向第一个操作u0，再将最后一个操作u指向update，是queue保持环状链表
    update.next = queue.panding.next; // queue.panding保存着最后一个操作update，因为是环状链表，所以next指向第一个操作u0
    queue.panding.next = update;
  }
  queue.panding = update;
  // 触发更新
  schedule();
}

function App() {
  const [num, updataNum] = useState(0);

  return {
    onclick() {
      updataNum((num) => num + 1);
    },
  };
}

window.app = schedule();
