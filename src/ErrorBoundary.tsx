// @ts-nocheck
import React from "react";
import { type StateSetter } from "./Editor";

interface ErrorBoundaryProps {
    setError: StateSetter<string>
    old: any
    children: any
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps> {

    constructor(props) {
        super(props);
        this.setError = props.setError;
        this.state = { error: false };
    }
  
    reset() {
        this.setState({ error: false });
    }

    static getDerivedStateFromError(error) {
        return { error: true }; 
    }
    
    componentDidCatch(error, errorInfo) {
        this.setError(error);
        console.log(error, errorInfo.componentStack);
    }
    render() {
        if (this.state.error) {
            return this.props.old;
        }
        return this.props.children;
    }
}