const resolvePromise = (promise2, x, resolve, reject) => {
  if (x === promise2) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }
  let called;
  if (x != null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject);
        }, err => {
          if (called) return;
          called = true;
          reject(err);
        })
      } else {
        // if(called)return;
        // called = true;
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
}

const MicrotaskFun = (someThings) => {
  const fn = () => {
    someThings();
    window.removeEventListener('message', fn);
  }
  window.addEventListener('message', fn);
  window.postMessage({});
}

const PromiseState = {
  PENDING: Symbol('pending'),
  RESOLVED: Symbol('resolved'),
  REJECTED: Symbol('rejected'),
}

export class MyPromise {
  constructor(executor) {
    this.status = PromiseState.PENDING;
    this.value = null;
    this.reason = null;

    this.resolvedQueues = [];
    this.rejectedQueues = [];

    if (typeof executor !== 'function') {
      throw new TypeError('Promise resolver undefined is not a function');
    }

    const resolve = value => {
      if (this.status == PromiseState.PENDING) {
        // console.log('---this.resolvedQueues---', this.resolvedQueues);
        this.value = value;
        this.status = PromiseState.RESOLVED;
        this.resolvedQueues.forEach(cb => cb(this.value))
      }
    }

    const reject = reason => {
      console.log('reject', reason);
      if (this.status == PromiseState.PENDING) {
        this.reason = reason;
        this.status = PromiseState.REJECTED;
        this.rejectedQueues.forEach(cb => cb(this.reason))
      }
    }

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    // 第二步 加上 return this
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === PromiseState.RESOLVED) {
        // MicrotaskFun();
        MicrotaskFun(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      }

      if (this.status === PromiseState.REJECTED) {
        MicrotaskFun(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      }

      if (this.status === PromiseState.PENDING) {
        this.resolvedQueues.push((value) => {
          MicrotaskFun(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        })
        this.rejectedQueues.push(() => {
          MicrotaskFun(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(promise2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        })
      }
    });

    return promise2;
  }
}
