export default function ContentItem({ title, person_firstname, person_lastname, setActivity, id, active, archive}) {
    return (
        <div className={'list-block__item' + active} onClick={()=>{setActivity(id)}}>
            <div className="list-block__wrapper">
                <p className="list-block__name">{title}</p>
            </div>
            <div className="list-block__wrapper">
            {archive ?
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_6709_2710)">
                        <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1V12.5C1 13.845 2.021 15 3.357 15H12.643ZM5.5 7H10.5C10.6326 7 10.7598 7.05268 10.8536 7.14645C10.9473 7.24021 11 7.36739 11 7.5C11 7.63261 10.9473 7.75979 10.8536 7.85355C10.7598 7.94732 10.6326 8 10.5 8H5.5C5.36739 8 5.24021 7.94732 5.14645 7.85355C5.05268 7.75979 5 7.63261 5 7.5C5 7.36739 5.05268 7.24021 5.14645 7.14645C5.24021 7.05268 5.36739 7 5.5 7ZM0.8 1C0.587827 1 0.384344 1.08429 0.234315 1.23431C0.0842855 1.38434 0 1.58783 0 1.8L0 3C0 3.21217 0.0842855 3.41566 0.234315 3.56569C0.384344 3.71571 0.587827 3.8 0.8 3.8H15.2C15.4122 3.8 15.6157 3.71571 15.7657 3.56569C15.9157 3.41566 16 3.21217 16 3V1.8C16 1.58783 15.9157 1.38434 15.7657 1.23431C15.6157 1.08429 15.4122 1 15.2 1H0.8Z"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_6709_2710">
                            <rect width="16" height="16" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>

                : null}
            </div>
            <div className="list-block__wrapper">
                <p className="list-block__person">{person_lastname} {person_firstname}</p>
            </div>
        </div>
    );
}