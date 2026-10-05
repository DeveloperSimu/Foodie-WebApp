import { Switch, Route } from "wouter";
import ShortsFeed from "./shorts/feed";
import ShortDetail from "./shorts/detail";
import ShortNew from "./shorts/new";

export default function ShortsRouter() {
  return (
    <Switch>
      <Route path="/shorts" component={ShortsFeed} />
      <Route path="/shorts/new" component={ShortNew} />
      <Route path="/shorts/:id" component={ShortDetail} />
    </Switch>
  );
}
