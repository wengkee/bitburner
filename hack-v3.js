/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	const sleeptime = ns.args[1]
	await ns.sleep(sleeptime - 200)
	await ns.hack(target);
}