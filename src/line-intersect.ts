"use strict";

export  interface Point {
	x: number;
	z: number;
}

export  interface IntersectionResult {
	check: boolean;
	x?: number;
	z?: number;
}

export  const subtractPoints = (point1: Point, point2: Point): Point => {
	return {
		x: point1.x - point2.x,
		z: point1.z - point2.z
	};
};

export  const crossProduct = (point1: Point, point2: Point): number => {
	return point1.x * point2.z - point1.z * point2.x;
};

export const doLineSegmentsIntersect = (p: Point, p2: Point, q: Point, q2: Point): IntersectionResult => {
	const r = subtractPoints(p2, p);
	const s = subtractPoints(q2, q);

	const denominator = crossProduct(r, s);

	if (denominator === 0) { // lines are parallel
		return {
			check: false
		};
	}

	const uNumerator = crossProduct(subtractPoints(q, p), r);

	const u = uNumerator / denominator;
	const t = crossProduct(subtractPoints(q, p), s) / denominator;

	return {
		check: ((t > 0) && (t < 1) && (u > 0) && (u < 1)),
		x: (p.x + t * r.x),
		z: (p.z + t * r.z)
	};
};
