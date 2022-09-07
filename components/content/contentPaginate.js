export default function ContentPaginate(props) {
    const {
        page,
        totalPages,
        onPageChange,
        className,
        visibleLinks,
        ...rest
    } = props;
    const pages = [];
    const visiblePages = Math.min(visibleLinks, totalPages);
    const half = Math.floor(visiblePages / 2);
    const start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + visiblePages);
    for (let i = start; i <= end; i++) {
        if (i !== totalPages){
            pages.push(i);
        }
    }

    return totalPages > 1 ? (
        <div className={`${className} content-paginate`} {...rest}>
            {start > 1 ? (
                <div
                    className={`content-paginate__page ${1 === props.page ? 'content-paginate__page--active' : ''}`}
                    onClick={totalPages !== "..." ? () => onPageChange(1) : null}
                >
                    1
                </div>
            ) : null}
            {start > 1 && (
                <div className="content-paginate__page">
                    ...
                </div>
            )}
            <div className="content-paginate__pages">
                {pages.map(page => (
                    <div
                        key={page}
                        className={`content-paginate__page ${page === props.page ? 'content-paginate__page--active' : ''}`}
                        onClick={page !== "..." ? () => onPageChange(page) : null}
                    >
                        {page}
                    </div>
                ))}
                {end < totalPages && (
                    <div className="content-paginate__page">
                        ...
                        </div>
                )}
                <div
                    className={`content-paginate__page ${totalPages === props.page ? 'content-paginate__page--active' : ''}`}
                    onClick={totalPages !== "..." ? () => onPageChange(totalPages) : null}
                >
                    {totalPages}
                </div>
            </div>
        </div>
    ) : null;
}