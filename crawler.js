/** @param {NS} ns */
export async function main(ns) {
    while (true){
        await crawl(ns)
        await ns.sleep(60000)
    }
}

async function prep(ns, target) {

    // ns.tprint(scripts + " copied to " + target)

    if (ns.hasRootAccess(target)) return true;
    
    function can(action) {
        return ns.fileExists(action + ".exe", "home");
    }
    
    let ports = 0;
    if (can("brutessh")) { ns.brutessh(target); ++ports; }
    if (can("ftpcrack")) { ns.ftpcrack(target); ++ports; }
    if (can("relaysmtp")) { ns.relaysmtp(target); ++ports; }
    if (can("httpworm")) { ns.httpworm(target); ++ports; }
    if (can("sqlinject")) { ns.sqlinject(target); ++ports; }
    
    if (ports >= ns.getServerNumPortsRequired(target)) {
        ns.nuke(target)
    } 
}

async function crawl(ns) {

    const sf = "other-servers.txt" // other servers that are already rooted
    const cf = "internal-servers.txt" // purchased servers, named after 'castle-black'
    const scripts = ["grow-v3.js", "hack-v3.js", "weaken-v3.js"]

    let hosts = ["home"]
    let seen = []

    let rooted = []
    if(ns.fileExists(sf)){
        rooted = ns.read(sf).split("\n");
        if (rooted.length == 1 && rooted[0] === "") rooted = [];
    }

    let internal = []
    if(ns.fileExists(cf)){
        internal = ns.read(cf).split("\n");
        if (internal.length == 1 && internal[0] === "") internal = [];
    }

    while (hosts.length > 0) {
        let h = hosts.shift();

        // We've already seen this host during this scan.
        if (seen.indexOf(h) != -1) continue;
        seen.push(h);

        await prep(ns, h)
        await ns.scp(scripts, h)

        if(h.startsWith("castle-black")){
            internal.push(h)
        } else if (ns.hasRootAccess(h) && rooted.indexOf(h) == -1) {
            rooted.push(h);
        }
        
        hosts = hosts.concat(ns.scan(h))
    }
    
    await ns.write(sf, rooted.join("\n"), "w")
    await ns.write(cf, internal.join("\n"), "w")

}