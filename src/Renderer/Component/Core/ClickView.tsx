import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  title?: string;
  onContextMenu?: () => void;
}

type State = {
}

export class ClickView extends React.Component<Props, State> {
  private handleContextMenu(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onContextMenu && this.props.onContextMenu();
  }

  private handleClick(ev: React.MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onClick();
  }

  render() {
    return (
      <Root
        title={this.props.title}
        onClick={this.handleClick.bind(this)}
        className={this.props.className}
        style={this.props.style}
        onContextMenu={this.handleContextMenu.bind(this)}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  
  & * {
    cursor: pointer;
  }
`;
