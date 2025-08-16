import React from "react";
type State = { hasError: boolean; error?: Error };
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: any) { console.error("[UI ErrorBoundary]", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:16}}>
          <div style={{maxWidth:720,width:"100%",border:"1px solid #eee",borderRadius:12,background:"#fff",padding:16}}>
            <h2 style={{margin:0,color:"#b00020"}}>Something went wrong</h2>
            <p style={{color:"#555"}}>Check the browser console for details.</p>
            {this.state.error && (
              <pre style={{whiteSpace:"pre-wrap",fontSize:12,background:"#fff5f5",color:"#b00020",padding:8,borderRadius:8}}>
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
