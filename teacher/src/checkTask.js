exports.hadnler = async (event, context) => {
    return {
        "given": event,
        "generated": "result",
        "context": context.clientContext
    };
}