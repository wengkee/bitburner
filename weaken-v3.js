/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	const sleeptime = ns.args[1]
	await ns.sleep(sleeptime)
	await ns.weaken(target);
}