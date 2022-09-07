export default function ErrorPage({title, message}) {
    return (
        <div className="error-page">
            <div className="error-page__content">
                <div className="error-page__content-title">
                    <h1>{title}</h1>
                </div>
                <div className="error-page__content-text">
                    <p>{message}</p>
                </div>
            </div>
        </div>
    );
}