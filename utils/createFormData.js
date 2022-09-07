async function createFormData(formData, data, key) {
    if ( ( typeof data === 'object' && data !== null ) || Array.isArray(data) ) {

        if ( typeof data === 'object' && data?.constructor.name === "File" ) {
            data = new Blob([new Uint8Array(await data?.arrayBuffer())], {type: data?.type })
            formData.append(key, data);
            return
        }

        for ( let i in data ) {
            if ( ( typeof data[i] === 'object' && data[i] !== null ) || Array.isArray(data[i]) ) {
                await createFormData(formData, data[i], key + '[' + i + ']');
            } else {
                formData.append(key + '[' + i + ']', data[i]);
            }
        }
    } else {
        formData.append(key, data);
    }
}

export default createFormData;