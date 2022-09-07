async function api (route, body){
    try {
        const options = {
            method: "GET",
            cache: 'no-cache',
            credentials: 'include'
        }

        options.headers = {
            Origin: window.location.origin,
        }

        if (body){
            options.method = "POST";
            options.body = body;
        }

        const response = await fetch(`${window.location.origin}/oapi${route}`, options);
        let json
        try {
            json = await response.json();
        } catch (error) {
            if (response.status === 200 && response.headers.get('Content-Length') === '0') {
                window.location.reload();
                return
            }
            throw error.message
        }
        if (json.success) {
            return json
        } else {
            throw new Error(`HTTP ${response.status} ${response.statusText}`)
        }

    } catch (error) {
        console.log(error)
    }
}

export default api;