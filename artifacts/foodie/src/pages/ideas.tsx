import { Switch, Route } from "wouter";
import IdeasFeed from "./ideas/feed";
import IdeaDetail from "./ideas/detail";
import IdeaNew from "./ideas/new";

export default function IdeasRouter() {
  return (
    <Switch>
      <Route path="/ideas" component={IdeasFeed} />
      <Route path="/ideas/new" component={IdeaNew} />
      <Route path="/ideas/:id" component={IdeaDetail} />
    </Switch>
  );
}
