let afk = false
let reason = ""

function setAFK(r) {
    afk = true
    reason = r || "lagi sibuk"
}

function clearAFK() {
    afk = false
}

function isAFK() {
    return afk
}

function getReason() {
    return reason
}

module.exports = {
    setAFK,
    clearAFK,
    isAFK,
    getReason
}
