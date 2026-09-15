import "./index.css";

export function App() {
  return (
    <div
      onClick={() => {
        console.log("Parent Parent onClick")
      }}
    >
      <div
        onClick={() => {
          console.log("Parent onClick")
        }}
      >
        <div
          style={{ background: "red" }}
          onClick={(event) => {
            console.log("onClick")
          }}
          onDoubleClick={() => {
            console.log("onDoubleClick")
          }}
        >
          HELLO
        </div>
      </div>
    </div>
  );
}

