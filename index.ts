type PromiseOperator<T> = (
	resolve: (value: T| PromiseLike<T>) => void,
	reject: (reason?: any) => void
) => void;

const promise: unique symbol = Symbol("innerPromise");

type SmartPromise<T> =
	(
		T extends (...args: infer P) => Promise<infer R> ?
			(...args: P) => SmartPromise<R> :
			T extends (...args: infer P) => infer R ?
				(...args: P) => SmartPromise<R> :
				{[P in keyof T]: SmartPromise<T[P]>}
	) & Promise<T>;

class State<T> extends Function implements Promise<T> {
	[promise]: Promise<T>;
	[Symbol.toStringTag]: string;

	constructor(inner: Promise<T>) {
		super();

		this[promise] = inner;
		this[Symbol.toStringTag] = this[promise][Symbol.toStringTag];
	}

	then<R1 = T, R2 = never>(onfulfilled?: (value: T) => R1 | PromiseLike<R1>,
			onrejected?: (reason: any) => R2 | PromiseLike<R2>): Promise<R1 | R2> {
		return this[promise].then(onfulfilled, onrejected);
	}

	catch<R = never>(onrejected?: (reason: any) => R | PromiseLike<R>):
			Promise<T | R> {
		return this[promise].catch(onrejected);
	}

	finally(onfinally?: () => void): Promise<T> {
		return this[promise].finally(onfinally);
	}
}

function get<K extends string | symbol, V, T extends Record<K, V>>(
	key: K, value: T): T[K] {
	const result = value[key];
	if (typeof result == "function") return result.bind(value);
	else return result;
}

const proxy: ProxyHandler<State<any>> = {
	get<K extends string | symbol, V, T extends Record<K, V>>(
			state: State<T>, key: K): SmartPromise<T[K]> {
		// @ts-ignore 'in' is a perfectly valid guard.
		if (key in state) return state[key];

		const oldState = state[promise].then(value => get(key, value));
		const newProxy: State<T[K]> = new Proxy(new State(oldState), proxy);
		return newProxy as unknown as SmartPromise<T[K]>;
	},

	has() {
		throw new Error();
	},

	apply<H, A extends any[], R, T extends (this: H, ...args: A) => R>(
			state: State<T>, self: H, args: A): SmartPromise<R> {
		const oldState = state[promise].then(value => value.apply(self, args));
		const newProxy: State<R> = new Proxy(new State(oldState), proxy);
		return newProxy as unknown as SmartPromise<R>;
	}
};

export function SmartPromise<T>(inner: PromiseLike<T> | PromiseOperator<T>):
		SmartPromise<T> {
	const handler = typeof inner == "function" ? inner : inner.then.bind(inner);
	const newProxy: State<T> = new Proxy(new State(new Promise(handler)), proxy);
	return newProxy as unknown as SmartPromise<T>;
}
