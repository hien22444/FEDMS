import { Markdown } from '../unix';

interface IProps {
  content: string;
}

export const Message = ({ content }: IProps) => {
  return (
    <div className=' '>
      <Markdown content={content} />
    </div>
  );
};
