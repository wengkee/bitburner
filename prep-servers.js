import { prepServer } from "helper-attack-v2.js"

/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	await prepServer(ns, target)
}