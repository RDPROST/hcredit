export default function ContentTitle({ title }) {
    return title ? (
        <h2 className="content__title">{title}</h2>
    ) : (
        <h2 className="content__title">Как управлять обучающими активностями</h2>
    )
}