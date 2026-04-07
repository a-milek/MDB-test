interface Props {
  status: unknown;
}
const Status = ({ status }: Props) => {
  return (
    <div>
      <div style={{ marginTop: 20 }}>
        {status ? (
          <pre style={{ color: "black" }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        ) : (
          <p>No status fetched yet.</p>
        )}
      </div>
    </div>
  );
};

export default Status;
