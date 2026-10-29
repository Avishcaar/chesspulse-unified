import './chess-loader.css';

export default function ChessLoader({ text = 'Loading...' }) {
    return (
        <div className="chess-loader-container">
            {text && <p className="chess-loader-text">{text}</p>}
        </div>
    );
}
