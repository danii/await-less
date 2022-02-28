Await Less
==========
A library to help you use `await`, less.

In a world full of prefix awaits [(ever heard of postfix await?)](https://doc.rust-lang.org/std/keyword.await.html), constantly having to wrap your expressions with parenthesis gets tedious. What if you could defer using await?

That's where Await Less' `SmartPromise` comes in. You can wrap any old promise with it, and then use it as if it was the finished value. Most actions performed on a `SmartPromise` will be automatically deferred and performed on the underlying value, once the promise completes.

### Before Await Less
```ts
await (await (await (await something()).getThat. doThat()).doThis()).getThat.doOther();
```

### After Await Less
```ts
await Smart(something()).getThat.doThat().doThis().getThat.doOther();
```
