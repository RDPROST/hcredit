import {useState} from "react";

export default function TrainersSlider({slides}) {
    const [slide, setSlide] = useState(0);

    const onClickPrevSlide = () => {
        if (slide > 0) {
            setSlide(slide - 1);
        }
        if (slide === 0) {
            setSlide(slides.length - 1)
        }
    }

    const onClickNextSlide = () => {
        if (slide < slides.length - 1) {
            setSlide(slide + 1);
        }
        if (slide === slides.length - 1) {
            setSlide(0)
        }
    }

    return slides.length > 0 ? (<div className="management__coach-slider">
        <div
            style={{background: `linear-gradient(0.57deg, #315B7C 6.68%, rgba(49, 91, 124, 0.510417) 34.56%, rgba(49, 91, 124, 0) 99.58%), url('${slides[slide]?.avatar || slides[slide]?.url}') no-repeat center / cover`}}
            className="management__coach-slider-item management__coach-slider-item_active">
                <p className="management__coach-slider-item-name">{slides[slide].firstname} {slides[slide].lastname}</p>
                <p className="management__coach-slider-item-org">{slides[slide].position_name}</p>
                {(slides.length > 1) ?
                    (
                        <div className="management__coach-slider-buttons">
                            <button
                                className="management__coach-slider-button management__coach-slider-button-prev"
                                type={"button"} onClick={onClickPrevSlide}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="12"
                                     viewBox="0 0 18 12"
                                     fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd"
                                          d="M17.7499 5.99981C17.7499 5.83405 17.6841 5.67508 17.5668 5.55787C17.4496 5.44066 17.2907 5.37481 17.1249 5.37481H2.38365L6.3174 1.44231C6.37551 1.3842 6.4216 1.31522 6.45305 1.23929C6.4845 1.16337 6.50069 1.08199 6.50069 0.999813C6.50069 0.917633 6.4845 0.836258 6.45305 0.760334C6.4216 0.684409 6.37551 0.615423 6.3174 0.557313C6.25929 0.499203 6.1903 0.453108 6.11438 0.421659C6.03845 0.39021 5.95708 0.374023 5.8749 0.374023C5.79272 0.374023 5.71134 0.39021 5.63542 0.421659C5.55949 0.453108 5.49051 0.499203 5.4324 0.557313L0.432397 5.55731C0.374193 5.61537 0.328014 5.68434 0.296506 5.76027C0.264998 5.8362 0.248779 5.9176 0.248779 5.99981C0.248779 6.08202 0.264998 6.16342 0.296506 6.23936C0.328014 6.31529 0.374193 6.38426 0.432397 6.44231L5.4324 11.4423C5.49051 11.5004 5.55949 11.5465 5.63542 11.578C5.71134 11.6094 5.79272 11.6256 5.8749 11.6256C5.95708 11.6256 6.03845 11.6094 6.11438 11.578C6.1903 11.5465 6.25929 11.5004 6.3174 11.4423C6.37551 11.3842 6.4216 11.3152 6.45305 11.2393C6.4845 11.1634 6.50069 11.082 6.50069 10.9998C6.50069 10.9176 6.4845 10.8363 6.45305 10.7603C6.4216 10.6844 6.37551 10.6154 6.3174 10.5573L2.38365 6.62481H17.1249C17.2907 6.62481 17.4496 6.55897 17.5668 6.44176C17.6841 6.32455 17.7499 6.16557 17.7499 5.99981Z"
                                    />
                                </svg>
                            </button>
                            <button
                                className="management__coach-slider-button management__coach-slider-button-next"
                                type={"button"} onClick={onClickNextSlide}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="12"
                                     viewBox="0 0 18 12"
                                     fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd"
                                          d="M0.250101 5.99981C0.250101 5.83405 0.315948 5.67508 0.433159 5.55787C0.550369 5.44066 0.709341 5.37481 0.875101 5.37481H15.6164L11.6826 1.44231C11.6245 1.3842 11.5784 1.31522 11.5469 1.23929C11.5155 1.16337 11.4993 1.08199 11.4993 0.999813C11.4993 0.917633 11.5155 0.836258 11.5469 0.760334C11.5784 0.684409 11.6245 0.615423 11.6826 0.557313C11.7407 0.499203 11.8097 0.453108 11.8856 0.421659C11.9615 0.39021 12.0429 0.374023 12.1251 0.374023C12.2073 0.374023 12.2887 0.39021 12.3646 0.421659C12.4405 0.453108 12.5095 0.499203 12.5676 0.557313L17.5676 5.55731C17.6258 5.61537 17.672 5.68434 17.7035 5.76027C17.735 5.8362 17.7512 5.9176 17.7512 5.99981C17.7512 6.08202 17.735 6.16342 17.7035 6.23935C17.672 6.31529 17.6258 6.38425 17.5676 6.44231L12.5676 11.4423C12.5095 11.5004 12.4405 11.5465 12.3646 11.578C12.2887 11.6094 12.2073 11.6256 12.1251 11.6256C12.0429 11.6256 11.9615 11.6094 11.8856 11.578C11.8097 11.5465 11.7407 11.5004 11.6826 11.4423C11.6245 11.3842 11.5784 11.3152 11.5469 11.2393C11.5155 11.1634 11.4993 11.082 11.4993 10.9998C11.4993 10.9176 11.5155 10.8363 11.5469 10.7603C11.5784 10.6844 11.6245 10.6154 11.6826 10.5573L15.6164 6.62481H0.875101C0.709341 6.62481 0.550369 6.55896 0.433159 6.44175C0.315948 6.32454 0.250101 6.16557 0.250101 5.99981Z"
                                    />
                                </svg>
                            </button>
                        </div>
                    ) : null
                }
            </div>
            <h1 className="management__coach-slider-item-title">О тренере</h1>
            <p className="management__coach-slider-item-description" dangerouslySetInnerHTML={{__html: slides[slide].desc}}></p>
        </div>) : null
}