exports.valid = {
    '0.1.SystemTest': {value: 'yes'}
}

exports.contains = (whole, needle) => {
    for (const key of Object.keys(needle)) {
        if (!whole.hasOwnProperty(key)) {
            return false;
        }
        if (whole[key] !== needle[key]) {
            return false;
        }
    }
    return true;
}

exports.sanitisedName = (name) => {
    return name.replace(/[^a-z0-9_.@-]/ig, '-')
}